// services/quotation.service.js
import mongoose from "mongoose";
import Quotation from "../models/quotation/quotation.model.js";
import Invoice from "../models/invoice/invoice.model.js";
import QuotationCounter from "../models/quotation/schemas/quotationCounter.model.js";
import { generateQuotationNumber } from "../utils/generateQuotationNumber.js";

const { Types } = mongoose;

function computeItemTotals(item) {
  const qty = Math.max(0, Number(item.quantity ?? 1));
  const price = Number(item.unit_price ?? 0);
  const gst_rate = Number(item.gst_rate ?? 0);
  const lineNet = qty * price;
  const gst_amount = +(lineNet * (gst_rate / 100));
  const total_amount = +(lineNet + gst_amount);
  return { gst_amount, total_amount };
}

function computeQuotationTotals(items, round_off = 0) {
  let subtotal = 0,
    total_gst = 0;
  items.forEach((it) => {
    subtotal += (it.quantity ?? 1) * (it.unit_price ?? 0);
    total_gst += Number(it.gst_amount ?? 0);
  });
  const total_amount = +(subtotal + total_gst + Number(round_off || 0));
  return {
    subtotal: +subtotal.toFixed(2),
    total_gst: +total_gst.toFixed(2),
    total_amount: +total_amount.toFixed(2),
  };
}

export const createQuotationService = async ({
  tenant_id,
  user_id,
  payload,
}) => {
  if (!payload.client) throw new Error("client is required");
  if (!payload.billing_entity) throw new Error("billing_entity is required");

  if (!Types.ObjectId.isValid(payload.client))
    throw new Error("Invalid client id");

  if (!Types.ObjectId.isValid(payload.billing_entity))
    throw new Error("Invalid billing entity id");

  // generate quotation number automatically
  const quotation_no = await generateQuotationNumber(tenant_id);

  const now = new Date();

  // process items
  const items = (payload.items || []).map((it) => {
    const copy = {
      service_id:
        it.service_id && Types.ObjectId.isValid(it.service_id)
          ? new Types.ObjectId(it.service_id)
          : null,

      description: it.description || it.service_name || "Item",
      quantity: Number(it.quantity || 1),
      unit_price: Number(it.unit_price || 0),
      gst_rate: Number(it.gst_rate || 0),
      meta: it.meta || {},
    };

    const totals = computeItemTotals(copy);

    copy.gst_amount = +totals.gst_amount.toFixed(2);
    copy.total_amount = +totals.total_amount.toFixed(2);

    return copy;
  });

  const totals = computeQuotationTotals(items, payload.round_off || 0);

  const doc = new Quotation({
    tenant_id,
    quotation_no,
    billing_entity: payload.billing_entity,
    client: payload.client,

    date: payload.date ? new Date(payload.date) : now,
    valid_until: payload.valid_until ? new Date(payload.valid_until) : null,

    items,
    subtotal: totals.subtotal,
    total_gst: totals.total_gst,
    round_off: Number(payload.round_off || 0),
    total_amount: totals.total_amount,

    terms: payload.terms || "",
    status: payload.status || "pending",

    created_by: user_id,
    updated_by: user_id,
  });

  await doc.save();

  return doc.toObject();
};

export const listQuotationsService = async ({
  tenant_id,
  page = 1,
  limit = 20,
  filters = {},
  search,
}) => {
  const query = { tenant_id, archived: false };
  if (filters.client && Types.ObjectId.isValid(filters.client))
    query.client = new Types.ObjectId(filters.client);
  if (filters.status) query.status = filters.status;
  if (filters.date_from || filters.date_to) {
    query.date = {};
    if (filters.date_from) query.date.$gte = new Date(filters.date_from);
    if (filters.date_to) query.date.$lte = new Date(filters.date_to);
  }
  if (search)
    query.$or = [
      { quotation_no: { $regex: search, $options: "i" } },
      { terms: { $regex: search, $options: "i" } },
    ];

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Quotation.find(query)
      .populate("client", "name file_no")
      .populate("billing_entity", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Quotation.countDocuments(query),
  ]);

  return {
    items,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
};

export const getQuotationByIdService = async ({ tenant_id, quotation_id }) => {
  if (!Types.ObjectId.isValid(quotation_id))
    throw new Error("Invalid quotation id");
  const q = await Quotation.findOne({
    _id: quotation_id,
    tenant_id,
    archived: false,
  })
    .populate("client", "name file_no address primary_contact_email")
    .populate("billing_entity")
    .lean();
  if (!q) throw new Error("Quotation not found");
  return q;
};

export const updateQuotationService = async ({
  tenant_id,
  user_id,
  quotation_id,
  payload,
}) => {
  if (!Types.ObjectId.isValid(quotation_id))
    throw new Error("Invalid quotation id");
  const q = await Quotation.findOne({ _id: quotation_id, tenant_id });
  if (!q) throw new Error("Quotation not found");
  if (q.status === "accepted")
    throw new Error("Cannot edit an accepted quotation (optional rule)");

  // allow updating meta fields; items handled by dedicated endpoints or by passing items
  if (payload.items) {
    // reprocess items similar to create
    const items = (payload.items || []).map((it) => {
      const copy = {
        service_id:
          it.service_id && Types.ObjectId.isValid(it.service_id)
            ? new Types.ObjectId(it.service_id)
            : null,
        description: it.description || it.service_name || "Item",
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || 0),
        gst_rate: Number(it.gst_rate || 0),
        meta: it.meta || {},
      };
      const t = computeItemTotals(copy);
      copy.gst_amount = +t.gst_amount.toFixed(2);
      copy.total_amount = +t.total_amount.toFixed(2);
      return copy;
    });
    q.items = items;
    const totals = computeQuotationTotals(
      items,
      payload.round_off || q.round_off || 0,
    );
    q.subtotal = totals.subtotal;
    q.total_gst = totals.total_gst;
    q.round_off = Number(payload.round_off ?? q.round_off ?? 0);
    q.total_amount = totals.total_amount;
  }

  // fields
  const updatable = [
    "billing_entity",
    "date",
    "valid_until",
    "terms",
    "quotation_no",
  ];
  updatable.forEach((k) => {
    if (payload[k] !== undefined) q[k] = payload[k];
  });

  q.updated_by = user_id;
  await q.save();
  return q.toObject();
};

export const deleteQuotationService = async ({
  tenant_id,
  user_id,
  quotation_id,
  force = false,
}) => {
  if (!Types.ObjectId.isValid(quotation_id))
    throw new Error("Invalid quotation id");
  const q = await Quotation.findOne({ _id: quotation_id, tenant_id });
  if (!q) throw new Error("Quotation not found");
  if (force) {
    await Quotation.deleteOne({ _id: quotation_id });
    return { hard: true };
  } else {
    q.archived = true;
    q.archived_at = new Date();
    q.updated_by = user_id;
    await q.save();
    return { hard: false, archived: q.toObject() };
  }
};

export const changeQuotationStatusService = async ({
  tenant_id,
  user_id,
  quotation_id,
  newStatus,
}) => {
  if (!Types.ObjectId.isValid(quotation_id))
    throw new Error("Invalid quotation id");
  if (!["pending", "accepted", "rejected", "cancelled"].includes(newStatus))
    throw new Error("Invalid status");
  const q = await Quotation.findOne({ _id: quotation_id, tenant_id });
  if (!q) throw new Error("Quotation not found");
  q.status = newStatus;
  q.updated_by = user_id;
  await q.save();
  return q.toObject();
};

/**
 * Optional: convert quotation to invoice
 * This is a simple stub — your invoice creation flow may differ.
 */
export const convertQuotationToInvoiceService = async ({
  tenant_id,
  user_id,
  quotation_id,
  payload = {},
}) => {
  if (!Types.ObjectId.isValid(quotation_id))
    throw new Error("Invalid quotation id");
  const q = await Quotation.findOne({ _id: quotation_id, tenant_id });
  if (!q) throw new Error("Quotation not found");

  // Build invoice payload from quotation
  const invoicePayload = {
    billing_entity: q.billing_entity,
    client: q.client,
    date: payload.date ?? new Date(),
    due_date: payload.due_date ?? null,
    invoice_no: payload.invoice_no ?? `INV-${Date.now()}`, // replace with your number generator
    items: q.items.map((it) => ({
      type: "manual",
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      gst_rate: it.gst_rate,
      source_id: null,
      meta: { from_quotation: q._id },
    })),
    round_off: q.round_off || 0,
    remark: payload.remark || `Converted from quotation ${q.quotation_no}`,
    status: "draft",
  };

  // Option A: call your Invoice service createInvoiceService here. For example:
  // const createdInvoice = await createInvoiceService({ tenant_id, user_id, payload: invoicePayload });

  // For now, return prepared payload (or actually create invoice if you wire in)
  return { invoicePayload, note: "Call createInvoiceService to persist" };
};
