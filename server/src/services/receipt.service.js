// services/receipt.service.js
import mongoose from "mongoose";
import Receipt from "../models/receipt/receipt.model.js";
import Invoice from "../models/invoice/invoice.model.js";
import Tenant from "../models/tenant/tenant.model.js";
import BillingEntity from "../models/billing/billingEntity.model.js";
import ReceiptCounter from "../models/receipt/schemas/receiptCounter.model.js";
import { generateReceiptPdfBuffer } from "../utils/pdf.helper.js";
import sendEmail from "../utils/sendEmail.js";
import stream from "stream";

const { Types } = mongoose;

function sumPayments(payments = []) {
  return payments.reduce((s, p) => s + Number(p.amount || 0), 0);
}

async function serverSupportsTransactions() {
  try {
    // "isMaster" works for many versions; newer servers may support "hello".
    const admin = mongoose.connection.db.admin();
    const info = await admin
      .command({ isMaster: 1 })
      .catch(() => admin.command({ hello: 1 }));
    // Replica set => has setName; mongos => msg === 'isdbgrid'
    if (info && (info.setName || info.msg === "isdbgrid")) return true;
    return false;
  } catch (err) {
    // if we can't determine, be conservative and assume no transactions
    return false;
  }
}

const maybeSyncCounter = async (tenantId, receiptNo) => {
  if (!receiptNo) return;

  const parts = receiptNo.split("/");
  if (parts.length < 3) return;

  const seqStr = parts[parts.length - 1];
  const seq = parseInt(seqStr);

  if (isNaN(seq)) return;

  const now = new Date();
  const calendarYear = now.getFullYear();
  const month = now.getMonth();
  const year = month >= 3 ? calendarYear : calendarYear - 1;

  try {
    const updated = await ReceiptCounter.findOneAndUpdate(
      { tenant_id: tenantId, year },
      { $max: { seq: seq } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[SyncCounter] Receipt counter for tenant ${tenantId} and year ${year} is now at ${updated.seq}`);
  } catch (e) {
    console.error(`[SyncCounter] Failed to sync receipt counter for ${receiptNo}:`, e.message);
  }
};

export const getNextReceiptNumber = async (tenant_id, prefix = "RCPT") => {
  const now = new Date();
  const calendarYear = now.getFullYear();
  const month = now.getMonth();
  const year = month >= 3 ? calendarYear : calendarYear - 1;

  const counter = await ReceiptCounter.findOne({ tenant_id, year });
  let nextSeq = counter ? counter.seq + 1 : 1;

  // financial year format
  const fyStart = year % 100;
  const fyEnd = (year + 1) % 100;
  const financialYear = `${fyStart}-${fyEnd}`;

  // Check actual collection to avoid desync
  const existingReceipts = await Receipt.find({
    tenant_id,
    receipt_no: new RegExp(`^${prefix}/${financialYear}/`, 'i'),
    archived: false
  }).select('receipt_no').lean();

  const existingSeqs = new Set();
  existingReceipts.forEach(rect => {
    const parts = rect.receipt_no.split('/');
    const seq = parseInt(parts[parts.length - 1]);
    if (!isNaN(seq)) existingSeqs.add(seq);
  });

  while (existingSeqs.has(nextSeq)) {
    nextSeq++;
  }

  const paddedSeq = String(nextSeq).padStart(4, "0");
  return `${prefix}/${financialYear}/${paddedSeq}`;
};

export const resetReceiptCounterService = async (tenantId, newSeq, yearStr) => {
  const year = 2000 + parseInt(yearStr);
  if (isNaN(year) || isNaN(newSeq)) throw new Error("Invalid year or sequence");

  const ReceiptCounter = mongoose.model("ReceiptCounter");
  await ReceiptCounter.findOneAndUpdate(
    { tenant_id: tenantId, year },
    { $set: { seq: newSeq - 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return getNextReceiptNumber(tenantId);
};

export const findAndIncrementReceiptNumber = async (tenant_id, prefix = "RCPT") => {
  const now = new Date();
  const calendarYear = now.getFullYear();
  const month = now.getMonth();
  const year = month >= 3 ? calendarYear : calendarYear - 1;

  const suggested = await getNextReceiptNumber(tenant_id, prefix);
  const nextSeq = parseInt(suggested.split('/').pop());

  const counter = await ReceiptCounter.findOneAndUpdate(
    { tenant_id, year },
    { $set: { seq: nextSeq } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const fyStart = year % 100;
  const fyEnd = (year + 1) % 100;
  const financialYear = `${fyStart}-${fyEnd}`;
  const paddedSeq = String(counter.seq).padStart(4, "0");

  return `${prefix}/${financialYear}/${paddedSeq}`;
};

export const createReceiptService = async ({ tenant_id, user_id, payload }) => {
  // validations
  if (!payload.client) throw new Error("client is required");
  // Default billing_entity to tenant_id if not provided (parity with Invoices)
  const billing_entity = payload.billing_entity || tenant_id;

  if (!Array.isArray(payload.payments) || payload.payments.length === 0) {
    throw new Error("at least one payment line is required");
  }

  if (!Types.ObjectId.isValid(payload.client))
    throw new Error("Invalid client id");
  if (!Types.ObjectId.isValid(billing_entity))
    throw new Error("Invalid billing entity id");

  // validate payments
  for (const p of payload.payments) {
    if (!p.amount || Number(p.amount) <= 0) {
      throw new Error("payment amount must be > 0");
    }
  }

  let receipt_no = payload.receipt_no;
  if (!receipt_no) {
    receipt_no = await findAndIncrementReceiptNumber(tenant_id, payload.prefix || "RCPT");
  } else {
    await maybeSyncCounter(tenant_id, receipt_no);
  }

  const received_amount = sumPayments(payload.payments);
  const tds_amount = Number(payload.tds_amount || 0);
  const discount = Number(payload.discount || 0);
  const round_off = Number(payload.round_off || 0);

  // compute available to apply
  const total_amount = +(received_amount - tds_amount - discount + round_off);

  const doc = new Receipt({
    tenant_id,
    receipt_no, // auto generated
    billing_entity,
    client: payload.client,
    date: payload.date ? new Date(payload.date) : new Date(),

    payments: payload.payments.map((p) => ({
      ...p,
      date: p.date ? new Date(p.date) : new Date(),
      created_by: user_id,
    })),

    received_amount,
    tds_amount,
    discount,
    round_off,
    total_amount,

    remark: payload.remark || "",
    created_by: user_id,
    updated_by: user_id,
    status: payload.status || "draft",
  });

  await doc.save();
  return doc.toObject();
};

export const listReceiptsService = async ({
  tenant_id,
  page = 1,
  limit = 20,
  filters = {},
  search,
}) => {
  const query = { tenant_id, archived: false };

  if (filters.client && Types.ObjectId.isValid(filters.client))
    query.client = new Types.ObjectId(filters.client);
  if (filters.date_from || filters.date_to) {
    query.date = {};
    if (filters.date_from) query.date.$gte = new Date(filters.date_from);
    if (filters.date_to) query.date.$lte = new Date(filters.date_to);
  }
  if (filters.status) query.status = filters.status;

  if (search)
    query.$or = [
      { receipt_no: { $regex: search, $options: "i" } },
      { remark: { $regex: search, $options: "i" } },
    ];

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Receipt.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("client", "name file_no")
      .lean(),
    Receipt.countDocuments(query),
  ]);

  return {
    items,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
};

export const getReceiptByIdService = async ({ tenant_id, receipt_id }) => {
  if (!Types.ObjectId.isValid(receipt_id))
    throw new Error("Invalid receipt id");

  let receipt = await Receipt.findOne({
    _id: receipt_id,
    tenant_id,
    archived: false,
  })
    .populate("client billing_entity")
    .lean();

  if (!receipt) throw new Error("Receipt not found");

  // If billing_entity failed to populate (e.g. ID mismatch between collections)
  if (receipt.billing_entity && typeof receipt.billing_entity !== 'object') {
    const entityId = receipt.billing_entity;
    // 1. Try Tenant (Main company)
    let entity = await Tenant.findById(entityId).lean();
    if (!entity) {
      // 2. Try BillingEntity (Other entities)
      entity = await BillingEntity.findById(entityId).lean();
    }
    receipt.billing_entity = entity || { _id: entityId, name: "Unknown Entity" };
  }

  // Fallback: If billing_entity is null/missing, try to use the main tenant doc
  if (!receipt.billing_entity) {
    receipt.billing_entity = await Tenant.findById(tenant_id).lean();
  }

  return receipt;
};

export const updateReceiptService = async ({
  tenant_id,
  user_id,
  receipt_id,
  payload,
}) => {
  if (!Types.ObjectId.isValid(receipt_id))
    throw new Error("Invalid receipt id");
  const receipt = await Receipt.findOne({ _id: receipt_id, tenant_id });
  if (!receipt) throw new Error("Receipt not found");
  if (receipt.status === "settled")
    throw new Error("Cannot update a settled receipt");

  if (payload.receipt_no && payload.receipt_no !== receipt.receipt_no) {
    receipt.receipt_no = payload.receipt_no;
    await maybeSyncCounter(tenant_id, payload.receipt_no);
  }

  // allow updating payments, remark, date before settlement
  if (payload.payments) {
    // validate payments similar to create
    const received_amount = sumPayments(payload.payments);
    receipt.payments = payload.payments.map((p) => ({
      ...p,
      date: p.date ? new Date(p.date) : new Date(),
      created_by: user_id,
    }));
    const tds_amount =
      payload.tds_amount !== undefined
        ? Number(payload.tds_amount)
        : Number(receipt.tds_amount || 0);
    const discount =
      payload.discount !== undefined
        ? Number(payload.discount)
        : Number(receipt.discount || 0);
    const round_off =
      payload.round_off !== undefined
        ? Number(payload.round_off)
        : Number(receipt.round_off || 0);
    receipt.received_amount = received_amount;
    receipt.total_amount = +(
      received_amount -
      tds_amount -
      discount +
      round_off
    );
  }

  if (payload.tds_amount !== undefined)
    receipt.tds_amount = Number(payload.tds_amount);
  if (payload.discount !== undefined)
    receipt.discount = Number(payload.discount);
  if (payload.round_off !== undefined)
    receipt.round_off = Number(payload.round_off);
  if (payload.remark !== undefined) receipt.remark = payload.remark;
  if (payload.date) receipt.date = new Date(payload.date);
  if (payload.billing_entity !== undefined) receipt.billing_entity = payload.billing_entity || tenant_id;

  receipt.updated_by = user_id;
  await receipt.save();
  return receipt.toObject();
};

export const deleteReceiptService = async ({
  tenant_id,
  user_id,
  receipt_id,
  force = false,
}) => {
  if (!Types.ObjectId.isValid(receipt_id))
    throw new Error("Invalid receipt id");
  const receipt = await Receipt.findOne({ _id: receipt_id, tenant_id });
  if (!receipt) throw new Error("Receipt not found");

  const originalReceiptNo = receipt.receipt_no;

  if (force) {
    // If applied to invoices, you should reverse application first — protect from accidental hard delete
    if (receipt.applied_invoices && receipt.applied_invoices.length > 0) {
      throw new Error(
        "Cannot hard delete a receipt that has applied invoices. Unapply first.",
      );
    }
    await Receipt.deleteOne({ _id: receipt_id });
  } else {
    if (receipt.status === "settled")
      throw new Error("Cannot archive a settled receipt. Unapply first.");

    // RENAME the receipt number to free it up for reuse, then archive
    const deletedNo = `${receipt.receipt_no}-DEL-${Date.now()}`;
    receipt.receipt_no = deletedNo;
    receipt.archived = true;
    receipt.archived_at = new Date();
    receipt.updated_by = user_id;
    await receipt.save();
  }

  // 3. Decrement counter ONLY if this was the latest receipt issued for this tenant/year
  const parts = originalReceiptNo.split("/");
  if (parts.length >= 3) {
    const seq = parseInt(parts[parts.length - 1]);
    const now = new Date();
    const calendarYear = now.getFullYear();
    const month = now.getMonth();
    const year = month >= 3 ? calendarYear : calendarYear - 1;

    const ReceiptCounter = mongoose.model("ReceiptCounter");
    const currentCounter = await ReceiptCounter.findOne({ tenant_id, year });

    if (currentCounter && currentCounter.seq === seq) {
      await ReceiptCounter.updateOne(
        { _id: currentCounter._id },
        { $inc: { seq: -1 } }
      );
    }
  }

  return force ? { hard: true } : { hard: false, archived: receipt.toObject() };
};

/**
 * Auto apply algorithm: apply available receipt amount to oldest unpaid invoices of this client
 */
export const autoApplyService = async ({ tenant_id, user_id, receipt_id }) => {
  if (!Types.ObjectId.isValid(receipt_id))
    throw new Error("Invalid receipt id");
  const receipt = await Receipt.findOne({ _id: receipt_id, tenant_id });
  if (!receipt) throw new Error("Receipt not found");
  const alreadyApplied = (receipt.applied_invoices || []).reduce(
    (s, a) => s + Number(a.amount_applied || 0),
    0,
  );
  let available = Number(receipt.total_amount || 0) - alreadyApplied;
  if (available <= 0) return receipt.toObject();

  // fetch unpaid invoices for client ordered by date asc
  const invoices = await Invoice.find({
    tenant_id,
    client: receipt.client,
    balance_due: { $gt: 0 },
    archived: false,
  })
    .sort({ date: 1 })
    .limit(200);

  const allocations = [];
  for (const inv of invoices) {
    if (available <= 0) break;
    const invBalance =
      typeof inv.balance_due === "number"
        ? Number(inv.balance_due)
        : Math.max(
          0,
          Number(inv.total_amount || 0) - Number(inv.amount_received || 0),
        );
    const toApply = Math.min(available, invBalance);
    if (toApply <= 0) continue;
    allocations.push({ invoiceId: inv._id, amount: toApply });
    available -= toApply;
  }

  if (allocations.length === 0) return receipt.toObject();

  return await applyToInvoicesService({
    tenant_id,
    user_id,
    receipt_id,
    allocations,
  });
};

/**
 * Apply receipt to invoices (transactional when supported)
 * allocations = [{ invoiceId, amount }]
 */
export const applyToInvoicesService = async ({
  tenant_id,
  user_id,
  receipt_id,
  allocations = [],
}) => {
  if (!Types.ObjectId.isValid(receipt_id))
    throw new Error("Invalid receipt id");
  if (!Array.isArray(allocations) || allocations.length === 0)
    throw new Error("allocations required");

  const canTxn = await serverSupportsTransactions();

  if (canTxn) {
    // original transaction path (unchanged other than using the check above)
    const session = await mongoose.startSession();
    let resultReceipt = null;
    try {
      await session.withTransaction(async () => {
        const receipt = await Receipt.findOne({
          _id: receipt_id,
          tenant_id,
        }).session(session);
        if (!receipt) throw new Error("Receipt not found");

        // compute available amount on receipt
        const alreadyApplied = (receipt.applied_invoices || []).reduce(
          (s, a) => s + Number(a.amount_applied || 0),
          0,
        );
        const available = Number(receipt.total_amount || 0) - alreadyApplied;
        if (available <= 0) throw new Error("No available amount to apply");

        let totalToApply = 0;
        const invoiceUpdates = [];
        for (const alloc of allocations) {
          const { invoiceId, amount } = alloc;
          if (!Types.ObjectId.isValid(invoiceId))
            throw new Error("Invalid invoice id in allocations");

          const already = (receipt.applied_invoices || []).find(
            (a) => a.invoice.toString() === invoiceId.toString(),
          );
          if (already)
            throw new Error(
              `Invoice ${invoiceId} already applied to this receipt`,
            );

          const invoice = await Invoice.findOne({
            _id: invoiceId,
            tenant_id,
          }).session(session);
          if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

          const amt = Number(amount || 0);
          if (amt <= 0) throw new Error("Allocation amount must be > 0");

          const invAmountReceived = Number(invoice.amount_received || 0);
          const invTotalAmount = Number(invoice.total_amount || 0);
          const invoiceBalance =
            typeof invoice.balance_due === "number"
              ? Number(invoice.balance_due)
              : Math.max(0, invTotalAmount - invAmountReceived);

          if (amt > invoiceBalance)
            throw new Error(
              `Allocation amount ${amt} exceeds balance ${invoiceBalance} for invoice ${invoice._id}`,
            );
          totalToApply += amt;
          invoiceUpdates.push({ invoice, amt });
        }

        if (totalToApply > available)
          throw new Error("Total allocations exceed available receipt amount");

        // apply updates
        const appliedEntries = [];
        for (const item of invoiceUpdates) {
          const inv = item.invoice;
          const amt = item.amt;

          const currentBalance =
            typeof inv.balance_due === "number"
              ? Number(inv.balance_due)
              : Math.max(0, (inv.total_amount || 0) - (inv.amount_received || 0));

          const newBalance = Math.max(0, currentBalance - amt);
          const newAmountReceived = (inv.amount_received || 0) + amt;

          appliedEntries.push({
            invoice: inv._id,
            invoice_no: inv.invoice_no,
            invoice_date: inv.date,
            invoice_amount: inv.total_amount || 0,
            invoice_balance: newBalance,
            amount_applied: amt,
          });

          inv.amount_received = newAmountReceived;
          inv.balance_due = newBalance;
          if (newBalance === 0 && inv.total_amount > 0) inv.status = "paid";
          else if (newBalance < inv.total_amount) inv.status = "partially_paid";

          inv.payments = inv.payments || [];
          inv.payments.push({
            amount: amt,
            date: new Date(),
            method: "receipt_applied",
            reference: receipt._id.toString(),
            note: `Applied from receipt ${receipt.receipt_no}`,
            created_by: user_id,
          });
          await inv.save({ session });
        }

        receipt.applied_invoices = [
          ...(receipt.applied_invoices || []),
          ...appliedEntries,
        ];
        const newAlreadyApplied = (receipt.applied_invoices || []).reduce(
          (s, a) => s + Number(a.amount_applied || 0),
          0,
        );
        if (newAlreadyApplied >= receipt.total_amount)
          receipt.status = "settled";
        else receipt.status = "partially_settled";
        receipt.updated_by = user_id;
        await receipt.save({ session });
        resultReceipt = receipt;
      });

      session.endSession();
      return resultReceipt.toObject();
    } catch (err) {
      session.endSession();
      throw err;
    }
  } else {
    // Fallback: no transactions supported — do operations sequentially (non-atomic)
    // WARNING: race conditions possible in concurrent environments.
    // We'll keep the same validations and then persist sequentially.

    // fetch receipt (no session)
    const receipt = await Receipt.findOne({ _id: receipt_id, tenant_id });
    if (!receipt) throw new Error("Receipt not found");

    const alreadyApplied = (receipt.applied_invoices || []).reduce(
      (s, a) => s + Number(a.amount_applied || 0),
      0,
    );
    let available = Number(receipt.total_amount || 0) - alreadyApplied;
    if (available <= 0) throw new Error("No available amount to apply");

    // validate allocations first
    let totalToApply = 0;
    const invoiceUpdates = [];
    for (const alloc of allocations) {
      const { invoiceId, amount } = alloc;
      if (!Types.ObjectId.isValid(invoiceId))
        throw new Error("Invalid invoice id in allocations");
      const already = (receipt.applied_invoices || []).find(
        (a) => a.invoice.toString() === invoiceId.toString(),
      );
      if (already)
        throw new Error(`Invoice ${invoiceId} already applied to this receipt`);

      const invoice = await Invoice.findOne({ _id: invoiceId, tenant_id });
      if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

      const amt = Number(amount || 0);
      if (amt <= 0) throw new Error("Allocation amount must be > 0");

      const invAmountReceived = Number(invoice.amount_received || 0);
      const invTotalAmount = Number(invoice.total_amount || 0);
      const invoiceBalance =
        typeof invoice.balance_due === "number"
          ? Number(invoice.balance_due)
          : Math.max(0, invTotalAmount - invAmountReceived);

      if (amt > invoiceBalance)
        throw new Error(
          `Allocation amount ${amt} exceeds balance ${invoiceBalance} for invoice ${invoice._id}`,
        );
      totalToApply += amt;
      invoiceUpdates.push({ invoice, amt });
    }

    if (totalToApply > available)
      throw new Error("Total allocations exceed available receipt amount");

    // apply updates sequentially (non-transactional)
    const appliedEntries = [];
    for (const item of invoiceUpdates) {
      const inv = item.invoice;
      const amt = item.amt;

      const currentBalance =
        typeof inv.balance_due === "number"
          ? Number(inv.balance_due)
          : Math.max(0, (inv.total_amount || 0) - (inv.amount_received || 0));

      const newBalance = Math.max(0, currentBalance - amt);
      const newAmountReceived = (inv.amount_received || 0) + amt;

      inv.payments = inv.payments || [];
      inv.payments.push({
        amount: amt,
        date: new Date(),
        method: "receipt_applied",
        reference: receipt._id.toString(),
        note: `Applied from receipt ${receipt.receipt_no}`,
        created_by: user_id,
      });

      inv.amount_received = newAmountReceived;
      inv.balance_due = newBalance;
      if (newBalance === 0 && inv.total_amount > 0) inv.status = "paid";
      else if (newAmountReceived > 0) inv.status = "partially_paid";

      // persist invoice
      await inv.save();

      appliedEntries.push({
        invoice: inv._id,
        invoice_no: inv.invoice_no,
        invoice_date: inv.date,
        invoice_amount: inv.total_amount || 0,
        invoice_balance: newBalance,
        amount_applied: amt,
      });
    }

    // update receipt and persist
    receipt.applied_invoices = [
      ...(receipt.applied_invoices || []),
      ...appliedEntries,
    ];
    const newAlreadyApplied = (receipt.applied_invoices || []).reduce(
      (s, a) => s + Number(a.amount_applied || 0),
      0,
    );
    if (newAlreadyApplied >= receipt.total_amount) receipt.status = "settled";
    else receipt.status = "partially_settled";
    receipt.updated_by = user_id;
    await receipt.save();

    return receipt.toObject();
  }
};

/**
 * Unapply / reverse allocations (transactional when available)
 * The same pattern — check serverSupportsTransactions() and either run inside a transaction or do sequential updates.
 */
export const unapplyReceiptService = async ({
  tenant_id,
  user_id,
  receipt_id,
  invoiceIds = [],
}) => {
  if (!Types.ObjectId.isValid(receipt_id))
    throw new Error("Invalid receipt id");
  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0)
    throw new Error("invoiceIds required");

  const canTxn = await serverSupportsTransactions();

  if (canTxn) {
    const session = await mongoose.startSession();
    try {
      let resultReceipt = null;
      await session.withTransaction(async () => {
        const receipt = await Receipt.findOne({
          _id: receipt_id,
          tenant_id,
        }).session(session);
        if (!receipt) throw new Error("Receipt not found");

        for (const invId of invoiceIds) {
          if (!Types.ObjectId.isValid(invId))
            throw new Error("Invalid invoice id in invoiceIds");

          const entry = receipt.applied_invoices.find(
            (a) => a.invoice.toString() === invId.toString(),
          );
          if (!entry) continue;
          const inv = await Invoice.findOne({ _id: invId, tenant_id }).session(
            session,
          );
          if (!inv) continue;

          inv.payments = (inv.payments || []).filter(
            (p) => p.reference !== receipt._id.toString(),
          );
          inv.amount_received = (inv.payments || []).reduce(
            (s, p) => s + Number(p.amount || 0),
            0,
          );
          inv.balance_due = Number(inv.total_amount || 0) - inv.amount_received;
          inv.status =
            inv.balance_due <= 0
              ? "paid"
              : inv.amount_received > 0
                ? "partially_paid"
                : "sent";
          await inv.save({ session });

          receipt.applied_invoices = receipt.applied_invoices.filter(
            (a) => a.invoice.toString() !== invId.toString(),
          );
        }

        const newApplied = (receipt.applied_invoices || []).reduce(
          (s, a) => s + Number(a.amount_applied || 0),
          0,
        );
        if (newApplied === 0) receipt.status = "draft";
        else if (newApplied >= receipt.total_amount) receipt.status = "settled";
        else receipt.status = "partially_settled";

        receipt.updated_by = user_id;
        await receipt.save({ session });
        resultReceipt = receipt;
      });

      session.endSession();
      return resultReceipt.toObject();
    } catch (err) {
      session.endSession();
      throw err;
    }
  } else {
    // non-transactional fallback
    const receipt = await Receipt.findOne({ _id: receipt_id, tenant_id });
    if (!receipt) throw new Error("Receipt not found");

    for (const invId of invoiceIds) {
      if (!Types.ObjectId.isValid(invId))
        throw new Error("Invalid invoice id in invoiceIds");

      const entry = receipt.applied_invoices.find(
        (a) => a.invoice.toString() === invId.toString(),
      );
      if (!entry) continue;
      const amt = Number(entry.amount_applied || 0);

      const inv = await Invoice.findOne({ _id: invId, tenant_id });
      if (!inv) {
        // skip
        continue;
      }

      inv.payments = (inv.payments || []).filter(
        (p) => p.reference !== receipt._id.toString(),
      );
      inv.amount_received = (inv.payments || []).reduce(
        (s, p) => s + Number(p.amount || 0),
        0,
      );
      inv.balance_due = Number(inv.total_amount || 0) - inv.amount_received;
      inv.status =
        inv.balance_due <= 0
          ? "paid"
          : inv.amount_received > 0
            ? "partially_paid"
            : "sent";
      await inv.save();

      receipt.applied_invoices = receipt.applied_invoices.filter(
        (a) => a.invoice.toString() !== invId.toString(),
      );
    }

    const newApplied = (receipt.applied_invoices || []).reduce(
      (s, a) => s + Number(a.amount_applied || 0),
      0,
    );
    if (newApplied === 0) receipt.status = "draft";
    else if (newApplied >= receipt.total_amount) receipt.status = "settled";
    else receipt.status = "partially_settled";

    receipt.updated_by = user_id;
    await receipt.save();
    return receipt.toObject();
  }
};

/**
 * Utility: list unpaid invoices for a client (with pagination)
 */
export const listUnpaidInvoicesForClient = async ({
  tenant_id,
  clientId,
  page = 1,
  limit = 20,
  minAmount = 0,
}) => {
  if (!Types.ObjectId.isValid(clientId)) throw new Error("Invalid client id");
  const query = {
    tenant_id,
    client: clientId,
    balance_due: { $gt: minAmount },
    archived: false,
  };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Invoice.find(query).sort({ date: 1 }).skip(skip).limit(limit).lean(),
    Invoice.countDocuments(query),
  ]);

  return {
    items,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
};

/**
 * Send receipt PDF via email
 */
export const sendReceiptService = async (user, receiptId, body) => {
  if (!body.to) throw new Error("Recipient email address (to) is required");

  const receipt = await Receipt.findOne({
    _id: receiptId,
    tenant_id: user.tenant_id,
    archived: false,
  })
    .populate("client billing_entity")
    .lean();

  if (!receipt) throw new Error("Receipt not found");

  const pdfBuffer = await generateReceiptPdfBuffer(receipt);

  const mailResult = await sendEmail({
    to: body.to,
    cc: body.cc,
    subject: body.subject || `Receipt ${receipt.receipt_no}`,
    text: body.message || "Please find the attached payment receipt.",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img 
            src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1774225986/users/tqg7thoai2g8yqhsvpr6.png" 
            alt="Profile"
            style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #e0e0e0;"
          />
        </div>
        <p>${(body.message || "Please find the attached payment receipt.").replace(/\n/g, "<br/>")}</p>
      </div>
    `,
    attachments: [{ filename: `${receipt.receipt_no}.pdf`, content: pdfBuffer }],
  });

  return mailResult;
};

/**
 * Get Receipt PDF Stream
 */
export const getReceiptPdfStream = async (user, receiptId) => {
  const receipt = await Receipt.findOne({
    _id: receiptId,
    tenant_id: user.tenant_id,
    archived: false,
  })
    .populate("client billing_entity")
    .lean();

  if (!receipt) throw new Error("Receipt not found");
  const buffer = await generateReceiptPdfBuffer(receipt);

  const rs = new stream.PassThrough();
  rs.end(buffer);
  return rs;
};
