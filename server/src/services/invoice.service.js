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

  const parts = invoiceNo.split("-");
  if (parts.length < 2) return;

  const yearStr = parts[parts.length - 2];
  const seqStr = parts[parts.length - 1];
  const year = parseInt(yearStr);
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
  const year = new Date().getFullYear();

  // 1. Get current counter
  const counter = await InvoiceCounter.findOne({ tenant_id: tenantId, year });
  let nextSeq = counter ? counter.seq + 1 : 1;

  // 2. Double check against actual invoices to prevent desync
  const latestInvoice = await Invoice.findOne({
    tenant_id: tenantId,
    invoice_no: new RegExp(`^INV-${year}-`, 'i'),
    archived: false
  }).sort({ invoice_no: -1 }).select('invoice_no').lean();

  if (latestInvoice) {
    const parts = latestInvoice.invoice_no.split("-");
    const latestSeq = parseInt(parts[parts.length - 1]);
    if (!isNaN(latestSeq) && latestSeq >= nextSeq) {
      logger.info(`[NextNumber] Found higher existing sequence in collection: ${latestSeq}. Adjusting suggestion.`);
      nextSeq = latestSeq + 1;
    }
  }

  const finalNo = `INV-${year}-${String(nextSeq).padStart(4, "0")}`;
  logger.info(`[NextNumber] Suggested invoice number for tenant ${tenantId}: ${finalNo}`);
  return finalNo;
};

export const findAndIncrementInvoiceNumber = async (tenantId) => {
  const year = new Date().getFullYear();

  // 1. Get the real next sequence by checking both counter and actual invoices
  const suggested = await getNextInvoiceNumber(tenantId);
  const nextSeq = parseInt(suggested.split('-').pop());

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

  return `INV-${year}-${String(counter.seq).padStart(4, "0")}`;
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

  // 1. Identify Year and Seq from invoice number (Format: INV-2026-0002)
  const parts = invoice.invoice_no.split("-");
  const year = parseInt(parts[parts.length - 2]);
  const seq = parseInt(parts[parts.length - 1]);

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
    .populate("client billing_entity")
    .lean();
  if (!inv) throw new Error("Invoice not found");

  const pdfBuffer = await generatePdfBuffer(inv);

  const mailResult = await sendEmail({
    to: body.to,
    cc: body.cc,
    subject: body.subject || `Invoice ${inv.invoice_no}`,
    text: body.message || "Please find the attached invoice.",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 20px;">
        <!-- Circular Image -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img 
            src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1774225986/users/tqg7thoai2g8yqhsvpr6.png" 
            alt="Profile"
            style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #e0e0e0;"
          />
        </div>
        <p>${(body.message || "Please find the attached invoice.").replace(/\\n/g, '<br/>')}</p>
      </div>
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
