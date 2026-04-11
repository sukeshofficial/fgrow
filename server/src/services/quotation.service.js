// services/quotation.service.js
import mongoose from "mongoose";
import Quotation from "../models/quotation/quotation.model.js";
import Invoice from "../models/invoice/invoice.model.js";
import QuotationCounter from "../models/quotation/schemas/quotationCounter.model.js";
import { generateQuotationNumber } from "../utils/generateQuotationNumber.js";
import { generateQuotationPdfBuffer } from "../utils/pdf.helper.js";
import { createInvoice } from "./invoice.service.js";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

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

  if (!Types.ObjectId.isValid(payload.client))
    throw new Error("Invalid client id");

  // Default billing_entity to tenant_id if not provided
  const billing_entity = payload.billing_entity || tenant_id;

  if (!Types.ObjectId.isValid(billing_entity))
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
    quotation_no: payload.quotation_no || (await generateQuotationNumber(tenant_id, { date: payload.date })),
    billing_entity,
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
      .populate("tenant_id")
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
    .populate("tenant_id")
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
    "client",
    "date",
    "valid_until",
    "terms",
    "quotation_no",
    "status",
  ];

  for (const k of updatable) {
    if (payload[k] !== undefined) {
      if (k === "billing_entity" || k === "client") {
        const val = payload[k] || (k === "billing_entity" ? tenant_id : undefined);
        if (!val) {
          if (k === "client") throw new Error("Client is required");
          continue; // should not happen for billing_entity due to fallback
        }
        if (!Types.ObjectId.isValid(val)) {
          throw new Error(`Invalid ${k} ID`);
        }
        q[k] = new Types.ObjectId(val);
      } else {
        q[k] = payload[k];
      }
    }
  }

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
    items: q.items.map((it) => ({
      type: "manual",
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      gst_rate: it.gst_rate,
      total_amount: it.total_amount,
      gst_amount: it.gst_amount,
      source_id: null,
      meta: { from_quotation: q._id },
    })),
    round_off: q.round_off || 0,
    remark: payload.remark || `Converted from quotation ${q.quotation_no}`,
  };

  const user = { _id: user_id, tenant_id: tenant_id };
  const createdInvoice = await createInvoice(user, invoicePayload);

  // Update quotation status
  q.status = "accepted";
  q.updated_by = user_id;
  await q.save();

  return createdInvoice;
};

export const sendQuotationService = async (user, quotationId, body) => {
  if (!body.to) throw new Error("Recipient email address (to) is required");

  // Populate client, billing_entity, and tenant_id (for fallback)
  const quotation = await Quotation.findOne({
    _id: quotationId,
    tenant_id: user.tenant_id,
    archived: false,
  })
    .populate("client billing_entity tenant_id")
    .lean();

  if (!quotation) throw new Error("Quotation not found");

  const pdfBuffer = await generateQuotationPdfBuffer(quotation);

  const mailResult = await sendEmail({
    to: body.to,
    cc: body.cc,
    subject: body.subject || `Quotation ${quotation.quotation_no} from ${(quotation.billing_entity?.name || quotation.tenant_id?.name || 'FGrow')}`,
    text: body.message || "Please find the attached quotation.",
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
                  <h1 style="margin: 0; color: #1e293b; font-size: 32px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">QUOTATION</h1>
                  <div style="margin-top: 12px;">
                    <span style="background-color: #f0fdf4; color: #166534; padding: 6px 16px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; border: 1px solid #dcfce7; letter-spacing: 0.05em;">${quotation.status || 'PENDING'}</span>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Billing Info columns -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 50px;">
              <tr>
                <td style="width: 50%; vertical-align: top; padding-right: 20px;">
                  <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">FROM</p>
                  <h3 style="margin: 0 0 4px 0; color: #1e293b; font-size: 16px; font-weight: 700;">${quotation.billing_entity?.name || quotation.tenant_id?.name || 'Your Company'}</h3>
                  <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">${quotation.billing_entity?.address || quotation.tenant_id?.officialAddress || 'Company Address'}</p>
                  <p style="margin: 4px 0; color: #1e293b; font-size: 12px; font-weight: 700;">GSTIN: ${quotation.billing_entity?.gstin || quotation.tenant_id?.gstNumber || '-'}</p>
                </td>
                <td style="width: 50%; vertical-align: top;">
                  <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">QUOTATION FOR</p>
                  <h3 style="margin: 0 0 4px 0; color: #1e293b; font-size: 16px; font-weight: 700;">${quotation.client?.name || 'Client Name'}</h3>
                  <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">${quotation.client?.address?.street || ''}, ${quotation.client?.address?.city || ''}</p>
                  <p style="margin: 4px 0; color: #1e293b; font-size: 12px; font-weight: 700;">GSTIN: ${quotation.client?.gstin || '-'}</p>
                </td>
              </tr>
            </table>

            <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 40px;"></div>

            <!-- Detail Grid -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 50px;">
              <tr>
                <td style="width: 25%; vertical-align: top;">
                  <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Quotation No</p>
                  <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 700;">${quotation.quotation_no}</p>
                </td>
                <td style="width: 25%; vertical-align: top;">
                  <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Date</p>
                  <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 700;">${new Date(quotation.date).toLocaleDateString('en-IN')}</p>
                </td>
                <td style="width: 25%; vertical-align: top;">
                  <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Valid Until</p>
                  <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 700;">${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-IN') : '-'}</p>
                </td>
                <td style="width: 25%; vertical-align: top; text-align: right;">
                  <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Amount</p>
                  <p style="margin: 0; color: #7c3aed; font-size: 18px; font-weight: 700;">₹${quotation.total_amount?.toLocaleString('en-IN')}</p>
                </td>
              </tr>
            </table>

            <!-- Items Table -->
            <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">LINE ITEMS</p>
            <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 20px;"></div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
              <thead>
                <tr style="border-bottom: 2px solid #f1f5f9;">
                  <th style="text-align: left; padding: 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Description</th>
                  <th style="text-align: center; padding: 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Qty</th>
                  <th style="text-align: right; padding: 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Price</th>
                  <th style="text-align: right; padding: 12px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(quotation.items || []).map(item => `
                  <tr style="border-bottom: 1px solid #f8fafc;">
                    <td style="padding: 16px 0; color: #1e293b; font-size: 13px; font-weight: 700;">${item.description || item.service_name || 'Item'}</td>
                    <td style="text-align: center; padding: 16px 0; color: #1e293b; font-size: 13px;">${item.quantity || 1}</td>
                    <td style="text-align: right; padding: 16px 0; color: #1e293b; font-size: 13px;">₹${(item.unit_price || 0).toLocaleString('en-IN')}</td>
                    <td style="text-align: right; padding: 16px 0; color: #1e293b; font-size: 13px; font-weight: 700;">₹${(item.total_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <p style="color: #475569; font-size: 15px; margin-bottom: 30px;">${(body.message || "Please find the attached quotation details.").replace(/\n/g, "<br/>")}</p>

            <!-- Totals Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin-top: 40px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Subtotal</td>
                  <td style="text-align: right; padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700;">₹${(quotation.subtotal || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Tax Total (GST)</td>
                  <td style="text-align: right; padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700;">₹${(quotation.total_gst || 0).toLocaleString('en-IN')}</td>
                </tr>
                ${quotation.round_off ? `
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Round Off</td>
                    <td style="text-align: right; padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700;">₹${quotation.round_off.toLocaleString('en-IN')}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="padding: 20px 0 0 0; border-top: 1px dashed #e2e8f0; color: #1e293b; font-size: 18px; font-weight: 700;">TOTAL</td>
                  <td style="text-align: right; padding: 20px 0 0 0; border-top: 1px dashed #e2e8f0; color: #7c3aed; font-size: 24px; font-weight: 700;">₹${quotation.total_amount?.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is a computer generated quotation.</p>
              <p style="color: #6366f1; font-size: 13px; font-weight: 700; margin: 8px 0 0 0;">Powered by FGrow</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `quotation-${quotation.quotation_no}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return mailResult;
};

export const getNextQuotationNumberService = async (tenant_id) => {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;

  // We don't want to increment here, just peek the next available number
  // But wait, the generateQuotationNumber as implemented increments it.
  // I should probably have a 'peek' version or just follow the Receipt/Invoice pattern.
  // In Receipts/Invoices, they often have a helper to get the next seq without incrementing.

  const counter = await QuotationCounter.findOne({
    tenant_id: new Types.ObjectId(tenant_id),
    year: y
  });

  const nextSeq = (counter?.seq || 0) + 1;
  const seqStr = String(nextSeq).padStart(3, "0");
  const fyShort = `${String(y % 100).padStart(2, "0")}-${String((y + 1) % 100).padStart(2, "0")}`;

  return `QUO/${fyShort}/${seqStr}`;
};

export const resetQuotationCounterService = async (tenant_id, newSeq, yearStr) => {
  // yearStr is e.g. "25" for 2025-26
  const fullYear = 2000 + parseInt(yearStr, 10);

  const counter = await QuotationCounter.findOneAndUpdate(
    { tenant_id: new Types.ObjectId(tenant_id), year: fullYear },
    { $set: { seq: newSeq - 1 } }, // We store (next - 1) because findOneAndUpdate $inc 1 gives next
    { new: true, upsert: true }
  );

  const seqStr = String(newSeq).padStart(3, "0");
  const fyShort = `${String(fullYear % 100).padStart(2, "0")}-${String((fullYear + 1) % 100).padStart(2, "0")}`;

  return `QUO/${fyShort}/${seqStr}`;
};
