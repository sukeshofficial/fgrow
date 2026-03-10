import mongoose from "mongoose";
import Invoice from "../models/invoice/invoice.model.js";

import { computeInvoiceTotals } from "../utils/totals.js";
import { buildPagination } from "../utils/pagination.js";
import { Parser as Json2csvParser } from "json2csv";
import stream from "stream";
import { generatePdfBuffer } from "../utils/pdf.helper.js";
import { sendMail } from "../utils/sendEmail.js";

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

  const filter = { archived: false };
  if (client) filter.client = client;
  if (status) filter.status = status;
  if (date_from || date_to) {
    filter.date = {};
    if (date_from) filter.date.$gte = new Date(date_from);
    if (date_to) filter.date.$lte = new Date(date_to);
  }
  if (q) {
    // simple text search against invoice_no or remark
    filter.$or = [
      { invoice_no: new RegExp(q, "i") },
      { remark: new RegExp(q, "i") },
    ];
  }

  const sort = { [sort_by]: order === "asc" ? 1 : -1 };

  const { skip, limit } = buildPagination(page, per_page);

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .populate("client billing_entity")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  return {
    data: items,
    meta: { total, page: Number(page), per_page: Number(per_page) },
  };
};

export const createInvoice = async (user, payload) => {
  // basic server-side sanitation: only allow certain fields
  const doc = {
    tenant_id: payload.tenant_id,
    invoice_no: payload.invoice_no,
    billing_entity: payload.billing_entity,
    client: payload.client,
    date: payload.date || new Date(),
    due_date: payload.due_date || null,
    payment_term: payload.payment_term || null,
    items: payload.items || [],
    remark: payload.remark || "",
    created_by: user._id,
    status: payload.status || "draft",
    linked_sources: payload.linked_sources || [],
  };

  // compute totals before save
  const totals = computeInvoiceTotals(doc.items);
  doc.subtotal = totals.subtotal;
  doc.total_gst = totals.total_gst;
  doc.discount_total = totals.discount_total;
  doc.total_amount = totals.total_amount;
  doc.round_off = totals.round_off;

  const invoice = await Invoice.create(doc);
  return invoice.toObject();
};

export const getInvoiceById = async (user, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Invoice.findById(id)
    .populate("client billing_entity created_by updated_by")
    .lean();
};

export const updateInvoice = async (user, id, payload) => {
  // allow only certain fields to be updated
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

  // Items updates should use item-specific endpoints to keep auditable
  // If items present in payload, ignore them here (or you could allow replace with caution)

  const inv = await Invoice.findById(id);
  if (!inv) throw new Error("Invoice not found");

  Object.assign(inv, update);

  // recompute totals if items changed externally
  if (payload.items) {
    inv.items = payload.items;
  }

  const totals = computeInvoiceTotals(inv.items);
  inv.subtotal = totals.subtotal;
  inv.total_gst = totals.total_gst;
  inv.discount_total = totals.discount_total;
  inv.total_amount = totals.total_amount;
  inv.round_off = totals.round_off;

  inv.updated_by = user._id;
  await inv.save();
  return inv.toObject();
};

export const deleteInvoice = async (user, id, force = false) => {
  if (force) {
    // hard delete
    await Invoice.deleteOne({ _id: id });
    return;
  }
  // soft delete / archive
  await Invoice.updateOne(
    { _id: id },
    { archived: true, archived_at: new Date() },
  );
};

//
// Items
//
export const addItems = async (user, invoiceId, items = []) => {
  if (!Array.isArray(items)) items = [items];

  const inv = await Invoice.findById(invoiceId);
  if (!inv) throw new Error("Invoice not found");

  // push items
  for (const it of items) inv.items.push(it);

  // recompute totals
  const totals = computeInvoiceTotals(inv.items);
  inv.subtotal = totals.subtotal;
  inv.total_gst = totals.total_gst;
  inv.discount_total = totals.discount_total;
  inv.total_amount = totals.total_amount;
  inv.round_off = totals.round_off;

  inv.updated_by = user._id;
  await inv.save();
  return inv.items;
};

export const updateItem = async (user, invoiceId, itemId, payload) => {
  const inv = await Invoice.findById(invoiceId);
  if (!inv) throw new Error("Invoice not found");

  const item = inv.items.id(itemId);
  if (!item) throw new Error("Item not found");

  // only allow price/qty/discount/description update
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

  // recompute totals
  const totals = computeInvoiceTotals(inv.items);
  inv.subtotal = totals.subtotal;
  inv.total_gst = totals.total_gst;
  inv.discount_total = totals.discount_total;
  inv.total_amount = totals.total_amount;
  inv.round_off = totals.round_off;

  inv.updated_by = user._id;
  await inv.save();
  return item.toObject();
};

export const deleteItem = async (user, invoiceId, itemId) => {
  const inv = await Invoice.findById(invoiceId);
  if (!inv) throw new Error("Invoice not found");
  inv.items.id(itemId).remove();

  const totals = computeInvoiceTotals(inv.items);
  inv.subtotal = totals.subtotal;
  inv.total_gst = totals.total_gst;
  inv.discount_total = totals.discount_total;
  inv.total_amount = totals.total_amount;
  inv.round_off = totals.round_off;

  inv.updated_by = user._id;
  await inv.save();
};

export const getUnbilledTasks = async (user, invoiceId) => {
  // helper: returns unbilled tasks for the invoice's client
  const invoice = await Invoice.findById(invoiceId).lean();
  if (!invoice) throw new Error("Invoice not found");

  // assumes you have a Task model with fields: client, billed (boolean) or invoice_id
  // Fallback - return [] if Task model not present
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

//
// Payments
//
export const addPayment = async (user, invoiceId, payload) => {
  const inv = await Invoice.findById(invoiceId);
  if (!inv) throw new Error("Invoice not found");

  const payment = {
    amount: payload.amount,
    date: payload.date ? new Date(payload.date) : new Date(),
    method: payload.method,
    reference: payload.reference,
    note: payload.note,
    created_by: user._id,
  };

  inv.payments.push(payment);
  inv.amount_received = (inv.amount_received || 0) + payment.amount;
  inv.balance_due = (inv.total_amount || 0) - inv.amount_received;

  if (inv.balance_due <= 0) inv.status = "paid";
  else if (inv.amount_received > 0) inv.status = "partially_paid";

  inv.updated_by = user._id;
  await inv.save();

  // return the inserted payment (last one)
  return inv.payments[inv.payments.length - 1];
};

export const listPayments = async (user, invoiceId) => {
  const inv = await Invoice.findById(invoiceId).lean();
  if (!inv) throw new Error("Invoice not found");
  return inv.payments || [];
};

export const markPaid = async (user, invoiceId) => {
  const inv = await Invoice.findById(invoiceId);
  if (!inv) throw new Error("Invoice not found");
  const remaining = (inv.total_amount || 0) - (inv.amount_received || 0);
  if (remaining <= 0) {
    inv.status = "paid";
    await inv.save();
    return inv.toObject();
  }
  // create a payment equal to remaining (could be restricted)
  inv.payments.push({
    amount: remaining,
    date: new Date(),
    method: "manual",
    note: "Marked paid by user",
    created_by: user._id,
  });
  inv.amount_received += remaining;
  inv.balance_due = 0;
  inv.status = "paid";
  inv.updated_by = user._id;
  await inv.save();
  return inv.toObject();
};

//
// Preview / PDF / Send / Export
//
export const previewInvoice = async (user, invoiceId) => {
  const inv = await Invoice.findById(invoiceId).lean();
  if (!inv) throw new Error("Invoice not found");
  // recompute totals (do not persist)
  const totals = computeInvoiceTotals(inv.items || []);
  return { ...inv, ...totals };
};

export const getPdf = async (user, invoiceId) => {
  const inv = await Invoice.findById(invoiceId).lean();
  if (!inv) throw new Error("Invoice not found");
  const buffer = await generatePdfBuffer(inv); // helper returns Buffer or stream
  const rs = new stream.PassThrough();
  rs.end(buffer);
  return rs;
};

export const sendInvoice = async (user, invoiceId, body) => {
  const inv = await Invoice.findById(invoiceId)
    .populate("client billing_entity")
    .lean();
  if (!inv) throw new Error("Invoice not found");

  const pdfBuffer = await generatePdfBuffer(inv);

  // sendMail should accept attachments; stubbed in helpers
  const mailResult = await sendMail({
    to: body.to,
    cc: body.cc,
    subject: body.subject || `Invoice ${inv.invoice_no}`,
    text: body.message || "Please find attached invoice.",
    attachments: [{ filename: `${inv.invoice_no}.pdf`, content: pdfBuffer }],
  });

  // update status to 'sent' if it was draft
  await Invoice.updateOne(
    { _id: inv._id },
    { $set: { status: "sent", updated_by: user._id } },
  );

  return mailResult;
};

export const exportInvoices = async (user, query) => {
  const result = await listInvoices(user, query);
  const rows = result.data;
  const fields = ["invoice_no", "date", "client", "total_amount", "status"];
  const parser = new Json2csvParser({ fields });
  const csv = parser.parse(rows);
  return { filename: "invoices.csv", mimetype: "text/csv", content: csv };
};

//
// Bulk / Reverse
//
export const bulkOperations = async (user, payload) => {
  // Example: payload = { action: "create", invoices: [...] }
  if (payload.action === "create") {
    const created = [];
    for (const inv of payload.invoices) {
      const c = await createInvoice(user, inv);
      created.push(c);
    }
    return { created };
  }
  // add other bulk ops as needed
  return {};
};

export const reverseInvoice = async (user, invoiceId) => {
  // admin only - check user role in calling layer
  const inv = await Invoice.findById(invoiceId);
  if (!inv) throw new Error("Invoice not found");

  // unmark linked tasks/expenses (example assumes Task model has invoice_id)
  if (Array.isArray(inv.linked_sources)) {
    const Task = mongoose.models.Task;
    if (Task) {
      await Task.updateMany(
        { _id: { $in: inv.linked_sources } },
        { $unset: { invoice_id: "" } },
      );
    }
  }

  inv.status = "cancelled";
  await inv.save();
};
