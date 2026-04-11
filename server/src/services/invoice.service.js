import mongoose from "mongoose";
import InvoiceCounter from "../models/invoice/schemas/invoiceCounter.model.js";
import Invoice from "../models/invoice/invoice.model.js";
import BillingEntity from "../models/billing/billingEntity.model.js";

import { computeInvoiceTotals } from "../utils/totals.js";
import { buildPagination } from "../utils/pagination.js";
import { Parser as Json2csvParser } from "json2csv";
import stream from "stream";
import { generatePdfBuffer } from "../utils/pdf.helper.js";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the base filter that always scopes queries to the current tenant.
 * Every DB query MUST include this to prevent cross-tenant data leaks.
 */
const tenantFilter = (user) => ({ tenant_id: user.tenant_id });

/**
 * Applies computed totals from the utility onto a Mongoose document in-place.
 */
const applyTotals = (inv, totals) => {
  inv.subtotal = totals.subtotal;
  inv.total_gst = totals.total_gst;
  inv.discount_total = totals.discount_total;
  inv.total_amount = totals.total_amount;
  inv.round_off = totals.round_off;

  // Sync balance_due whenever totals change
  const paid = inv.amount_received || 0;
  inv.balance_due = Math.max(0, inv.total_amount - paid);
};

const syncTaskLinks = async (user, invoiceId, items) => {
  let Task;
  try {
    Task = mongoose.model("Task");
  } catch (e) {
    return;
  }

  const taskIds = items
    .filter((it) => it.source_id)
    .map((it) => it.source_id);

  // 1. Unlink tasks that were previously linked to this invoice but are no longer in the items
  await Task.updateMany(
    { invoice_id: invoiceId, _id: { $nin: taskIds }, ...tenantFilter(user) },
    { $unset: { invoice_id: "" } }
  );

  // 2. Link tasks that are now in the items
  if (taskIds.length > 0) {
    await Task.updateMany(
      { _id: { $in: taskIds }, ...tenantFilter(user) },
      { $set: { invoice_id: invoiceId } }
    );
  }
};

const maybeSyncCounter = async (user, invoiceNo) => {
  if (!invoiceNo) return;

  const parts = invoiceNo.split("/");
  if (parts.length < 3) return;

  const yearStr = parts[1].split("-")[0];
  const seqStr = parts[parts.length - 1];
  const year = 2000 + parseInt(yearStr);
  const seq = parseInt(seqStr);

  if (isNaN(year) || isNaN(seq)) return;

  try {
    const updated = await InvoiceCounter.findOneAndUpdate(
      { tenant_id: user.tenant_id, year },
      { $max: { seq: seq } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logger.info(`[SyncCounter] Counter for tenant ${user.tenant_id} and year ${year} is now at ${updated.seq}`);
  } catch (e) {
    logger.error(`[SyncCounter] Failed to sync counter for ${invoiceNo}:`, e.message);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// A. CRUD & listing
// ─────────────────────────────────────────────────────────────────────────────

export const listInvoices = async (user, query) => {
  const {
    page = 1,
    per_page = 20,
    q,
    client,
    status,
    date_from,
    date_to,
    sort_by = "date",
    order = "desc",
  } = query;

  // FIX: Always scope to the calling user's tenant
  const filter = { ...tenantFilter(user), archived: false };

  if (client) filter.client = client;
  if (status) filter.status = status;

  if (date_from || date_to) {
    filter.date = {};
    if (date_from) filter.date.$gte = new Date(date_from);
    if (date_to) filter.date.$lte = new Date(date_to);
  }

  if (q) {
    filter.$or = [
      { invoice_no: new RegExp(q, "i") },
      { remark: new RegExp(q, "i") },
    ];
  }

  // Whitelist sort_by to prevent arbitrary field injection
  const allowedSortFields = [
    "date",
    "due_date",
    "invoice_no",
    "total_amount",
    "status",
    "createdAt",
  ];
  const safeSortBy = allowedSortFields.includes(sort_by) ? sort_by : "date";
  const sort = { [safeSortBy]: order === "asc" ? 1 : -1 };

  const { skip, limit } = buildPagination(page, per_page);

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .populate("client", "name email")
      .populate("billing_entity", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select("invoice_no date due_date total_amount amount_received balance_due status client billing_entity createdAt")
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  return {
    data: items,
    meta: { total, page: Number(page), per_page: Number(per_page) },
  };
};

export const createInvoice = async (user, payload) => {
  const doc = {
    // FIX: tenant_id always comes from the authenticated user, never from the payload
    tenant_id: user.tenant_id,
    invoice_no: payload.invoice_no || (await findAndIncrementInvoiceNumber(user.tenant_id)),
    billing_entity: payload.billing_entity || user.tenant_id,
    client: payload.client,
    date: payload.date || new Date(),
    due_date: payload.due_date || null,
    payment_term: payload.payment_term || null,
    items: payload.items || [],
    remark: payload.remark || "",
    created_by: user._id,
    status: "draft", // FIX: status cannot be set by the caller on creation
    linked_sources: payload.linked_sources || [],
  };

  applyTotals(doc, computeInvoiceTotals(doc.items));
  doc.balance_due = Math.max(0, (doc.total_amount || 0) - (doc.amount_received || 0));

  logger.info(`[InvoiceService] Creating invoice for tenant ${user.tenant_id}. Invoice No: ${doc.invoice_no}`);
  const invoice = await Invoice.create(doc);

  // Sync task links
  await syncTaskLinks(user, invoice._id, invoice.items);

  // Sync counter if manual number used
  if (payload.invoice_no) {
    logger.info(`[InvoiceService] Manual invoice number provided: ${payload.invoice_no}. Syncing counter...`);
    await maybeSyncCounter(user, payload.invoice_no);
  }

  return invoice.toObject();
};

export const getNextInvoiceNumber = async (tenantId) => {
  const now = new Date();
  const calendarYear = now.getFullYear();
  const month = now.getMonth();
  const year = month >= 3 ? calendarYear : calendarYear - 1;

  // 1. Get current counter
  const counter = await InvoiceCounter.findOne({ tenant_id: tenantId, year });
  let nextSeq = counter ? counter.seq + 1 : 1;

  // financial year format
  const fyStart = year % 100;
  const fyEnd = (year + 1) % 100;
  const financialYear = `${fyStart}-${fyEnd}`;

  // 2. Double check against actual invoices to prevent desync
  const existingInvoices = await Invoice.find({
    tenant_id: tenantId,
    invoice_no: new RegExp(`^INV/${financialYear}/`, 'i'),
    archived: false
  }).select('invoice_no').lean();

  const existingSeqs = new Set();
  existingInvoices.forEach(inv => {
    const parts = inv.invoice_no.split('/');
    const seq = parseInt(parts[parts.length - 1]);
    if (!isNaN(seq)) existingSeqs.add(seq);
  });

  while (existingSeqs.has(nextSeq)) {
    logger.info(`[NextNumber] Sequence ${nextSeq} already occupied. Checking next available slot.`);
    nextSeq++;
  }

  const finalNo = `INV/${financialYear}/${String(nextSeq).padStart(4, "0")}`;
  logger.info(`[NextNumber] Suggested invoice number for tenant ${tenantId}: ${finalNo}`);
  return finalNo;
};

export const resetInvoiceCounterService = async (tenantId, newSeq, yearStr) => {
  const year = 2000 + parseInt(yearStr);
  if (isNaN(year) || isNaN(newSeq)) throw new Error("Invalid year or sequence");

  const InvoiceCounter = mongoose.model("InvoiceCounter");
  await InvoiceCounter.findOneAndUpdate(
    { tenant_id: tenantId, year },
    { $set: { seq: newSeq - 1 } }, // so getNext returning +1 gets newSeq
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return getNextInvoiceNumber(tenantId);
};

export const findAndIncrementInvoiceNumber = async (tenantId) => {
  const now = new Date();
  const calendarYear = now.getFullYear();
  const month = now.getMonth();
  const year = month >= 3 ? calendarYear : calendarYear - 1;

  // 1. Get the real next sequence by checking both counter and actual invoices
  const suggested = await getNextInvoiceNumber(tenantId);
  const nextSeq = parseInt(suggested.split('/').pop());

  // 2. Update counter to this new sequence
  const counter = await InvoiceCounter.findOneAndUpdate(
    { tenant_id: tenantId, year },
    { $set: { seq: nextSeq } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  const fyStart = year % 100;
  const fyEnd = (year + 1) % 100;
  const financialYear = `${fyStart}-${fyEnd}`;

  return `INV/${financialYear}/${String(counter.seq).padStart(4, "0")}`;
};

export const getInvoiceById = async (user, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  // FIX: Scoped to tenant
  return Invoice.findOne({ _id: id, ...tenantFilter(user), archived: false })
    .populate("client billing_entity created_by updated_by")
    .lean();
};

export const updateInvoice = async (user, id, payload) => {
  const allowed = [
    "billing_entity",
    "client",
    "date",
    "due_date",
    "payment_term",
    "remark",
    "status",
    "linked_sources",
    "invoice_no",
  ];

  const update = {};
  for (const k of allowed) if (payload[k] !== undefined) update[k] = payload[k];

  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({ _id: id, ...tenantFilter(user) });
  if (!inv) throw new Error("Invoice not found");

  // Apply updates
  Object.assign(inv, update);

  if (payload.items) {
    // Robust replacement of subdocuments
    inv.items.splice(0, inv.items.length, ...payload.items);
  }

  // Recalculate totals
  const totals = computeInvoiceTotals(inv.items);
  applyTotals(inv, totals);

  // Sync balance due
  const paid = inv.amount_received || 0;
  inv.balance_due = Math.max(0, inv.total_amount - paid);

  // Auto-status update
  if (inv.balance_due === 0 && inv.total_amount > 0 && inv.status !== 'cancelled') {
    inv.status = 'paid';
  } else if (inv.balance_due < inv.total_amount && inv.balance_due > 0) {
    inv.status = 'partially_paid';
  }

  inv.updated_by = user._id;
  inv.markModified('items');

  await inv.save();

  // Sync task links
  if (payload.items) {
    await syncTaskLinks(user, inv._id, inv.items);
  }

  // Sync counter if manual number used
  if (payload.invoice_no) {
    logger.info(`[InvoiceService] Update payload has invoice number: ${payload.invoice_no}. Syncing counter...`);
    await maybeSyncCounter(user, payload.invoice_no);
  }

  return inv.toObject();
};

export const deleteInvoice = async (user, id, force = false) => {
  const filter = { _id: id, ...tenantFilter(user) };

  const invoice = await Invoice.findOne(filter);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // If already archived and force not requested
  if (invoice.archived && !force) {
    throw new Error("Invoice already deleted");
  }

  // 1. Identify Year and Seq from invoice number (Format: INV/26-27/0002)
  const parts = invoice.invoice_no.split("/");
  let year = new Date().getFullYear();
  let seq = 0;
  if (parts.length >= 3) {
    const yearStr = parts[1].split("-")[0];
    year = 2000 + parseInt(yearStr);
    seq = parseInt(parts[parts.length - 1]);
  }

  if (force) {
    await Invoice.deleteOne(filter);
  } else {
    // RENAME the invoice number to free it up for reuse, then archive
    const deletedNo = `${invoice.invoice_no}-DEL-${Date.now()}`;
    await Invoice.updateOne(filter, {
      invoice_no: deletedNo,
      archived: true,
      archived_at: new Date(),
      archived_by: user.id,
    });
  }

  // 3. Decrement counter ONLY if this was the latest invoice issued for this tenant/year
  const InvoiceCounter = mongoose.model("InvoiceCounter");
  const currentCounter = await InvoiceCounter.findOne({ tenant_id: user.tenant_id, year });

  if (currentCounter && currentCounter.seq === seq) {
    await InvoiceCounter.updateOne(
      { _id: currentCounter._id },
      { $inc: { seq: -1 } }
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// B. Items
// ─────────────────────────────────────────────────────────────────────────────

export const addItems = async (user, invoiceId, items = []) => {
  if (!Array.isArray(items)) items = [items];

  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({ _id: invoiceId, ...tenantFilter(user) });
  if (!inv) throw new Error("Invoice not found");

  for (const it of items) inv.items.push(it);

  applyTotals(inv, computeInvoiceTotals(inv.items));
  inv.updated_by = user._id;
  await inv.save();

  // Sync task links
  await syncTaskLinks(user, inv._id, inv.items);

  return inv.items;
};

export const updateItem = async (user, invoiceId, itemId, payload) => {
  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({ _id: invoiceId, ...tenantFilter(user) });
  if (!inv) throw new Error("Invoice not found");

  const item = inv.items.id(itemId);
  if (!item) throw new Error("Item not found");

  [
    "description",
    "quantity",
    "unit_price",
    "discount",
    "gst_rate",
    "meta",
  ].forEach((k) => {
    if (payload[k] !== undefined) item[k] = payload[k];
  });

  applyTotals(inv, computeInvoiceTotals(inv.items));
  inv.updated_by = user._id;
  await inv.save();
  return item.toObject();
};

export const deleteItem = async (user, invoiceId, itemId) => {
  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({ _id: invoiceId, ...tenantFilter(user) });
  if (!inv) throw new Error("Invoice not found");

  const item = inv.items.id(itemId);
  if (!item) throw new Error("Item not found");

  // FIX: .remove() is deprecated in Mongoose 7+; use deleteOne() on the subdoc
  item.deleteOne();

  applyTotals(inv, computeInvoiceTotals(inv.items));
  inv.updated_by = user._id;
  await inv.save();
};

export const getUnbilledTasks = async (user, clientId) => {
  let Task;
  try {
    Task = mongoose.model("Task");
  } catch (e) {
    return [];
  }

  // Scoped to tenant and specified client
  const tasks = await Task.find({
    ...tenantFilter(user),
    client: clientId,
    invoice_id: { $exists: false },
    archived: { $ne: true },
  }).lean();

  return tasks;
};

// ─────────────────────────────────────────────────────────────────────────────
// C. Payments
// ─────────────────────────────────────────────────────────────────────────────

export const addPayment = async (user, invoiceId, payload) => {
  // FIX: Validate payment amount up front
  const amount = Number(payload.amount);
  if (!amount || amount <= 0)
    throw new Error("Payment amount must be greater than 0");

  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({ _id: invoiceId, ...tenantFilter(user) });
  if (!inv) throw new Error("Invoice not found");

  if (inv.status === "cancelled")
    throw new Error("Cannot add payment to a cancelled invoice");

  const payment = {
    amount,
    date: payload.date ? new Date(payload.date) : new Date(),
    method: payload.method,
    reference: payload.reference,
    note: payload.note,
    created_by: user._id,
  };

  inv.payments.push(payment);
  inv.amount_received = (inv.amount_received || 0) + amount;
  inv.balance_due = Math.max(0, (inv.total_amount || 0) - inv.amount_received);

  if (inv.balance_due <= 0) inv.status = "paid";
  else if (inv.amount_received > 0) inv.status = "partially_paid";

  inv.updated_by = user._id;
  await inv.save();

  return inv.payments[inv.payments.length - 1];
};

export const listPayments = async (user, invoiceId) => {
  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({
    _id: invoiceId,
    ...tenantFilter(user),
  }).lean();
  if (!inv) throw new Error("Invoice not found");
  return inv.payments || [];
};

export const markPaid = async (user, invoiceId) => {
  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({ _id: invoiceId, ...tenantFilter(user) });
  if (!inv) throw new Error("Invoice not found");

  if (inv.status === "cancelled")
    throw new Error("Cannot mark a cancelled invoice as paid");

  const remaining = Math.max(
    0,
    (inv.total_amount || 0) - (inv.amount_received || 0),
  );

  if (remaining <= 0) {
    inv.status = "paid";
    await inv.save();
    return inv.toObject();
  }

  inv.payments.push({
    amount: remaining,
    date: new Date(),
    method: "manual",
    note: "Marked as paid by user",
    created_by: user._id,
  });
  inv.amount_received += remaining;
  inv.balance_due = 0;
  inv.status = "paid";
  inv.updated_by = user._id;
  await inv.save();
  return inv.toObject();
};

// ─────────────────────────────────────────────────────────────────────────────
// D. Preview / PDF / Send / Export
// ─────────────────────────────────────────────────────────────────────────────

export const previewInvoice = async (user, invoiceId) => {
  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({
    _id: invoiceId,
    ...tenantFilter(user),
  }).lean();
  if (!inv) throw new Error("Invoice not found");
  const totals = computeInvoiceTotals(inv.items || []);
  return { ...inv, ...totals };
};

export const getPdf = async (user, invoiceId) => {
  const inv = await Invoice.findOne({
    _id: invoiceId,
    ...tenantFilter(user),
    archived: false,
  })
    .populate([{ path: "client" }, { path: "billing_entity" }])
    .lean();

  if (!inv) throw new Error("Invoice not found");
  const buffer = await generatePdfBuffer(inv);

  const rs = new stream.PassThrough();
  rs.end(buffer);

  return rs;
};

export const sendInvoice = async (user, invoiceId, body) => {
  if (!body.to) throw new Error("Recipient email address (to) is required");

  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({ _id: invoiceId, ...tenantFilter(user) })
    .populate("client billing_entity tenant_id")
    .lean();
  if (!inv) throw new Error("Invoice not found");

  const pdfBuffer = await generatePdfBuffer(inv);

  const mailResult = await sendEmail({
    to: body.to,
    cc: body.cc,
    subject: body.subject || `Invoice ${inv.invoice_no} from ${inv.billing_entity?.name || 'FGrow'}`,
    text: body.message || "Please find the attached invoice.",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Space Mono', 'Courier New', Courier, monospace;">
        <div style="padding: 40px 20px;">
          <div style="max-width: 850px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 60px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
            
            <!-- Header Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
              <tr>
                <td style="vertical-align: top; width: 120px;">
                  <img 
                    src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1775310579/tenants/a7tvcuo0moqztzeoevaz.png" 
                    alt="Logo"
                    style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0;"
                  />
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <h1 style="margin: 0; color: #1e293b; font-size: 32px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; font-family: 'Space Mono', monospace;">TAX INVOICE</h1>
                  <div style="margin-top: 12px;">
                    <span style="background-color: #f0fdf4; color: #166534; padding: 6px 16px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; border: 1px solid #dcfce7; letter-spacing: 0.05em;">${inv.status || 'UNPAID'}</span>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Billing Info columns -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 50px;">
              <tr>
                <td style="width: 50%; vertical-align: top; padding-right: 20px;">
                  <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">BILL FROM</p>
                  <h3 style="margin: 0 0 4px 0; color: #1e293b; font-size: 16px; font-weight: 700;">${(inv.billing_entity && inv.billing_entity.name) ? inv.billing_entity.name : (inv.tenant_id?.name || 'Your Company')}</h3>
                  <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">${(inv.billing_entity && inv.billing_entity.officialAddress) ? inv.billing_entity.officialAddress : (inv.tenant_id?.officialAddress || 'Company Address')}</p>
                  <p style="margin: 4px 0; color: #1e293b; font-size: 12px; font-weight: 700;">GSTIN: ${inv.billing_entity?.gstNumber || inv.tenant_id?.gstNumber || '-'}</p>
                </td>
                <td style="width: 50%; vertical-align: top;">
                  <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">BILL TO</p>
                  <h3 style="margin: 0 0 4px 0; color: #1e293b; font-size: 16px; font-weight: 700;">${inv.client?.name || 'Client Name'}</h3>
                  <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">${inv.client?.address?.street || ''}, ${inv.client?.address?.city || ''}</p>
                  <p style="margin: 4px 0; color: #1e293b; font-size: 12px; font-weight: 700;">GSTIN: ${inv.client?.gstin || '-'}</p>
                </td>
              </tr>
            </table>

            <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 40px;"></div>

            <!-- Invoice Details Row -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
              <tr>
                <td style="width: 33%;">
                  <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Invoice No</p>
                  <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 700;">${inv.invoice_no}</p>
                </td>
                <td style="width: 33%;">
                  <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Date</p>
                  <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 700;">${new Date(inv.date).toLocaleDateString('en-IN')}</p>
                </td>
                <td style="width: 33%;">
                  <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Due Date</p>
                  <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 700;">${inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '-'}</p>
                </td>
              </tr>
            </table>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
              <thead>
                <tr style="border-bottom: 2px solid #f1f5f9;">
                  <th style="text-align: left; padding: 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Description</th>
                  <th style="text-align: right; padding: 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 80px;">Qty</th>
                  <th style="text-align: right; padding: 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 120px;">Price</th>
                  <th style="text-align: right; padding: 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 120px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(inv.items || []).map(item => `
                  <tr style="border-bottom: 1px solid #f8fafc;">
                    <td style="padding: 16px 0; color: #1e293b; font-size: 13px; font-weight: 700;">${item.description}</td>
                    <td style="text-align: right; padding: 16px 0; color: #1e293b; font-size: 13px;">${item.quantity || 1}</td>
                    <td style="text-align: right; padding: 16px 0; color: #1e293b; font-size: 13px;">₹${(item.unit_price || 0).toLocaleString('en-IN')}</td>
                    <td style="text-align: right; padding: 16px 0; color: #1e293b; font-size: 13px; font-weight: 700;">₹${(item.total_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <p style="color: #475569; font-size: 15px; margin-bottom: 40px; border-left: 4px solid #7c3aed; padding-left: 16px;">${(body.message || "Please find the attached invoice.").replace(/\n/g, '<br/>')}</p>

            <!-- Totals Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin-left: auto; width: 300px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #64748b; font-size: 13px; padding-bottom: 12px;">Subtotal</td>
                  <td style="text-align: right; color: #1e293b; font-size: 13px; font-weight: 700; padding-bottom: 12px;">₹${(inv.subtotal || 0).toLocaleString('en-IN')}</td>
                </tr>
                 <tr>
                  <td style="color: #64748b; font-size: 13px; padding-bottom: 12px;">GST</td>
                  <td style="text-align: right; color: #1e293b; font-size: 13px; font-weight: 700; padding-bottom: 12px;">₹${(inv.total_gst || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr><td colspan="2" style="padding: 8px 0;"><div style="height: 1px; background-color: #e2e8f0;"></div></td></tr>
                <tr>
                  <td style="color: #1e293b; font-size: 14px; font-weight: 700; padding-top: 12px; text-transform: uppercase;">Total</td>
                  <td style="text-align: right; color: #7c3aed; font-size: 20px; font-weight: 800; padding-top: 12px;">₹${(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </table>
            </div>

            <p style="margin-top: 60px; text-align: center; color: #94a3b8; font-size: 11px;">Powered by FGrow - Building together.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{ filename: `${inv.invoice_no}.pdf`, content: pdfBuffer }],
  });

  // Only advance from draft → sent; do not regress from paid/partially_paid
  if (inv.status === "draft") {
    await Invoice.updateOne(
      { _id: inv._id },
      { $set: { status: "sent", updated_by: user._id } },
    );
  }

  return mailResult;
};

export const exportInvoices = async (user, query) => {
  // FIX: Pass user so listInvoices scopes to the right tenant
  const result = await listInvoices(user, { ...query, per_page: 10000 });
  const rows = result.data.map((inv) => ({
    invoice_no: inv.invoice_no,
    date: inv.date,
    client: inv.client?.name || inv.client,
    total_amount: inv.total_amount,
    amount_received: inv.amount_received,
    balance_due: inv.balance_due,
    status: inv.status,
  }));

  const fields = [
    "invoice_no",
    "date",
    "client",
    "total_amount",
    "amount_received",
    "balance_due",
    "status",
  ];
  const parser = new Json2csvParser({ fields });
  const csv = parser.parse(rows);

  const timestamp = new Date().toISOString().split("T")[0];
  return {
    filename: `invoices-${timestamp}.csv`,
    mimetype: "text/csv",
    content: csv,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// E. Bulk / Reverse
// ─────────────────────────────────────────────────────────────────────────────

export const bulkOperations = async (user, payload) => {
  if (payload.action === "create") {
    if (!Array.isArray(payload.invoices) || payload.invoices.length === 0) {
      throw new Error("invoices array is required for bulk create");
    }

    const created = await Promise.all(
      payload.invoices.map((inv) =>
        createInvoice(user, {
          ...inv,
          tenant_id: user.tenant_id,
        }),
      ),
    );

    return { created };
  }

  throw new Error(`Unsupported bulk action: "${payload.action}"`);
};

export const reverseInvoice = async (user, invoiceId) => {
  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({ _id: invoiceId, ...tenantFilter(user) });
  if (!inv) throw new Error("Invoice not found");

  if (inv.status === "cancelled")
    throw new Error("Invoice is already cancelled");

  if (Array.isArray(inv.linked_sources) && inv.linked_sources.length > 0) {
    const Task = mongoose.models.Task;
    if (Task) {
      await Task.updateMany(
        { _id: { $in: inv.linked_sources } },
        { $unset: { invoice_id: "" } },
      );
    }
  }

  inv.status = "cancelled";
  inv.updated_by = user._id;
  await inv.save();
};
