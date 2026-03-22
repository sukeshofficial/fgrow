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
      .select("invoice_no date total_amount amount_received balance_due status client billing_entity createdAt")
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
    invoice_no: await getNextInvoiceNumber(user.tenant_id),
    billing_entity: payload.billing_entity,
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

  const invoice = await Invoice.create(doc);
  return invoice.toObject();
};

export const getNextInvoiceNumber = async (tenantId) => {
  const year = new Date().getFullYear();

  const counter = await InvoiceCounter.findOneAndUpdate(
    { tenant_id: tenantId, year }, // find this tenant's counter for this year
    { $inc: { seq: 1 } }, // atomically bump the sequence
    {
      new: true, // return the document AFTER the increment
      upsert: true, // create the counter document if it doesn't exist yet
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
  ];

  const update = {};
  for (const k of allowed) if (payload[k] !== undefined) update[k] = payload[k];

  // FIX: Scoped to tenant
  const inv = await Invoice.findOne({ _id: id, ...tenantFilter(user) });
  if (!inv) throw new Error("Invoice not found");

  Object.assign(inv, update);

  if (payload.items) {
    inv.items = payload.items;
  }

  applyTotals(inv, computeInvoiceTotals(inv.items));
  inv.updated_by = user._id;
  await inv.save();
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

  await Invoice.updateOne(filter, {
    archived: true,
    archived_at: new Date(),
    archived_by: user.id,
  });
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

export const getUnbilledTasks = async (user, invoiceId) => {
  // FIX: Scoped to tenant
  const invoice = await Invoice.findOne({
    _id: invoiceId,
    ...tenantFilter(user),
  }).lean();
  if (!invoice) throw new Error("Invoice not found");

  let Task;
  try {
    Task = mongoose.model("Task");
  } catch (e) {
    return [];
  }

  const tasks = await Task.find({
    client: invoice.client,
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
  console.log(inv);
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
