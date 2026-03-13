// services/receipt.service.js
import mongoose from "mongoose";
import Receipt from "../models/receipt/receipt.model.js";
import Invoice from "../models/invoice/invoice.model.js";
import ReceiptCounter from "../models/receipt/schemas/receiptCounter.model.js";

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

export const generateReceiptNumber = async (tenant_id, prefix = "RCPT") => {
  const now = new Date();
  const year = now.getFullYear();

  // atomic increment
  const counter = await ReceiptCounter.findOneAndUpdate(
    { tenant_id, year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  const seq = counter.seq;

  // financial year format (25-26)
  const fyStart = year % 100;
  const fyEnd = (year + 1) % 100;

  const financialYear = `${fyStart}-${fyEnd}`;

  const paddedSeq = String(seq).padStart(4, "0");

  return `${prefix}/${financialYear}/${paddedSeq}`;
};

export const createReceiptService = async ({ tenant_id, user_id, payload }) => {
  // validations
  if (!payload.client) throw new Error("client is required");
  if (!payload.billing_entity) throw new Error("billing_entity is required");

  if (!Array.isArray(payload.payments) || payload.payments.length === 0) {
    throw new Error("at least one payment line is required");
  }

  if (!Types.ObjectId.isValid(payload.client))
    throw new Error("Invalid client id");
  if (!Types.ObjectId.isValid(payload.billing_entity))
    throw new Error("Invalid billing entity id");

  // validate payments
  for (const p of payload.payments) {
    if (!p.amount || Number(p.amount) <= 0) {
      throw new Error("payment amount must be > 0");
    }
  }

  const receipt_no = await generateReceiptNumber(
    tenant_id,
    payload.prefix || "RCPT",
  );

  const received_amount = sumPayments(payload.payments);
  const tds_amount = Number(payload.tds_amount || 0);
  const discount = Number(payload.discount || 0);
  const round_off = Number(payload.round_off || 0);

  // compute available to apply
  const total_amount = +(received_amount - tds_amount - discount + round_off);

  const doc = new Receipt({
    tenant_id,
    receipt_no, // auto generated
    billing_entity: payload.billing_entity,
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
    Receipt.find(query).sort({ date: -1 }).skip(skip).limit(limit).lean(),
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
  const receipt = await Receipt.findOne({
    _id: receipt_id,
    tenant_id,
    archived: false,
  })
    .populate(
      "client",
      "name file_no address primary_contact_mobile primary_contact_email",
    )
    .populate(
      "billing_entity",
      "name companyAddress companyPhone companyEmail gstNumber registrationNumber logoUrl",
    )
    .lean();
  if (!receipt) throw new Error("Receipt not found");
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

  if (force) {
    // If applied to invoices, you should reverse application first — protect from accidental hard delete
    if (receipt.applied_invoices && receipt.applied_invoices.length > 0) {
      throw new Error(
        "Cannot hard delete a receipt that has applied invoices. Unapply first.",
      );
    }
    await Receipt.deleteOne({ _id: receipt_id });
    return { hard: true };
  } else {
    if (receipt.status === "settled")
      throw new Error("Cannot archive a settled receipt. Unapply first.");
    receipt.archived = true;
    receipt.archived_at = new Date();
    receipt.updated_by = user_id;
    await receipt.save();
    return { hard: false, archived: receipt.toObject() };
  }
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
          appliedEntries.push({
            invoice: inv._id,
            invoice_no: inv.invoice_no,
            invoice_date: inv.date,
            invoice_amount: inv.total_amount || 0,
            amount_applied: amt,
          });

          inv.payments = inv.payments || [];
          inv.payments.push({
            amount: amt,
            date: new Date(),
            method: "receipt_applied",
            reference: receipt._id.toString(),
            note: `Applied from receipt ${receipt.receipt_no}`,
            created_by: user_id,
          });
          inv.amount_received = Number(inv.amount_received || 0) + amt;
          inv.balance_due = Number(inv.total_amount || 0) - inv.amount_received;
          if (inv.balance_due <= 0) inv.status = "paid";
          else if (inv.amount_received > 0) inv.status = "partially_paid";
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

      inv.payments = inv.payments || [];
      inv.payments.push({
        amount: amt,
        date: new Date(),
        method: "receipt_applied",
        reference: receipt._id.toString(),
        note: `Applied from receipt ${receipt.receipt_no}`,
        created_by: user_id,
      });
      inv.amount_received = Number(inv.amount_received || 0) + amt;
      inv.balance_due = Number(inv.total_amount || 0) - inv.amount_received;
      if (inv.balance_due <= 0) inv.status = "paid";
      else if (inv.amount_received > 0) inv.status = "partially_paid";
      // persist invoice
      await inv.save();
      appliedEntries.push({
        invoice: inv._id,
        invoice_no: inv.invoice_no,
        invoice_date: inv.date,
        invoice_amount: inv.total_amount || 0,
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
