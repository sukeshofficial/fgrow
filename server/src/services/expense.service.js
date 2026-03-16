import mongoose from "mongoose";
import Expense from "../models/expense/expense.model.js";
import Invoice from "../models/invoice/invoice.model.js";
import cloudinary from "../utils/cloudinary.js";
import ExpenseCategory from "../models/expense/schemas/expenseCategory.model.js";
import PaymentMode from "../models/expense/schemas/paymentMode.model.js";

import { generateExpenseNumber } from "../utils/generateExpenseNumber.js";
import { uploadFileToCloud } from "../utils/cloudinary.js";

import fs from "fs";

const { Types } = mongoose;

/* ---- small helpers ---- */
function computeExpenseTotals({
  amount = 0,
  tds_amount = 0,
  discount = 0,
  round_off = 0,
}) {
  const a = Number(amount || 0);
  const tds = Number(tds_amount || 0);
  const disc = Number(discount || 0);
  const ro = Number(round_off || 0);
  const total = a - tds - disc + ro;
  return { total_amount: +total.toFixed(2) };
}

function sumAppliedInvoices(appliedInvoices = []) {
  return (appliedInvoices || []).reduce(
    (s, ai) => s + Number(ai.amount_applied || 0),
    0,
  );
}

/* ---- services ---- */

export const createExpenseService = async ({ tenant_id, user_id, payload }) => {
  if (!payload) throw new Error("payload required");
  if (!payload.amount && payload.amount !== 0)
    throw new Error("amount is required");

  if (payload.client && !Types.ObjectId.isValid(payload.client))
    throw new Error("Invalid client id");

  // generate expense number (uses current date unless payload.date is present)
  const expense_no = await generateExpenseNumber(tenant_id, {
    date: payload.date,
  });

  // compute totals
  const totals = computeExpenseTotals({
    amount: payload.amount,
    tds_amount: payload.tds_amount,
    discount: payload.discount,
    round_off: payload.round_off,
  });

  // set payment_mode summary if payments provided and a mode exists
  let payment_mode = payload.payment_mode || null;
  if (
    (!payment_mode || payment_mode === "") &&
    Array.isArray(payload.payments) &&
    payload.payments.length > 0
  ) {
    payment_mode = payload.payments[0].payment_mode || null;
  }

  const doc = new Expense({
    tenant_id,
    expense_no,
    category: payload.category || null,
    client: payload.client || null,
    date: payload.date ? new Date(payload.date) : new Date(),
    amount: Number(payload.amount),
    tds_amount: Number(payload.tds_amount || 0),
    discount: Number(payload.discount || 0),
    round_off: Number(payload.round_off || 0),
    total_amount: totals.total_amount,
    payment_mode,
    payments: payload.payments || [],
    billing_status: payload.billing_status || "unbilled",
    invoice: payload.invoice || null,
    applied_invoices: payload.applied_invoices || [],
    notes: payload.notes || "",
    files: payload.files || [],
    created_by: user_id,
    updated_by: user_id,
  });

  await doc.save();
  return doc.toObject();
};

export const listExpensesService = async ({
  tenant_id,
  page = 1,
  limit = 20,
  filters = {},
  search,
  sort = { date: -1 },
}) => {
  const query = { tenant_id: new Types.ObjectId(tenant_id), archived: false };

  if (filters.client && Types.ObjectId.isValid(filters.client))
    query.client = new Types.ObjectId(filters.client);
  if (filters.category && Types.ObjectId.isValid(filters.category))
    query.category = new Types.ObjectId(filters.category);
  if (filters.billing_status) query.billing_status = filters.billing_status;
  if (filters.payment_mode && Types.ObjectId.isValid(filters.payment_mode))
    query.payment_mode = new Types.ObjectId(filters.payment_mode);

  if (filters.date_from || filters.date_to) {
    query.date = {};
    if (filters.date_from) query.date.$gte = new Date(filters.date_from);
    if (filters.date_to) {
      // include the entire day
      const to = new Date(filters.date_to);
      to.setHours(23, 59, 59, 999);
      query.date.$lte = to;
    }
  }

  if (search) {
    const regex = { $regex: search, $options: "i" };
    query.$or = [
      { expense_no: regex },
      { notes: regex },
      { "payments.reference": regex },
    ];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Expense.find(query)
      .populate("client", "name contact")
      .populate("category", "name")
      .populate("invoice", "invoice_no date total_amount")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Expense.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / limit),
    },
  };
};

export const getExpenseByIdService = async ({ tenant_id, expense_id }) => {
  if (!Types.ObjectId.isValid(expense_id))
    throw new Error("Invalid expense id");
  const e = await Expense.findOne({
    _id: expense_id,
    tenant_id,
    archived: false,
  })
    .populate("client", "name contact")
    .populate("category", "name")
    .populate("invoice", "invoice_no date total_amount")
    .lean();
  if (!e) throw new Error("Expense not found");
  return e;
};

export const updateExpenseService = async ({
  tenant_id,
  user_id,
  expense_id,
  payload,
}) => {
  if (!Types.ObjectId.isValid(expense_id))
    throw new Error("Invalid expense id");
  const e = await Expense.findOne({ _id: expense_id, tenant_id });
  if (!e) throw new Error("Expense not found");

  // business rule: allow edits unless you want to lock billed ones
  // Example: prevent editing if fully billed:
  // if (e.billing_status === 'billed') throw new Error('Cannot edit a fully billed expense');

  // Update basic fields
  const updatable = ["category", "client", "date", "notes", "invoice"];
  updatable.forEach((k) => {
    if (payload[k] !== undefined) e[k] = payload[k];
  });

  if (payload.amount !== undefined) e.amount = Number(payload.amount);
  if (payload.tds_amount !== undefined)
    e.tds_amount = Number(payload.tds_amount || 0);
  if (payload.discount !== undefined)
    e.discount = Number(payload.discount || 0);
  if (payload.round_off !== undefined)
    e.round_off = Number(payload.round_off || 0);

  // payments replace or append depending on your UI; here we replace if provided
  if (payload.payments) e.payments = payload.payments;

  // files replace or append - here append if provided
  if (Array.isArray(payload.files) && payload.files.length > 0) {
    e.files = e.files.concat(payload.files);
  }

  // recalc totals
  const totals = computeExpenseTotals({
    amount: e.amount,
    tds_amount: e.tds_amount,
    discount: e.discount,
    round_off: e.round_off,
  });
  e.total_amount = totals.total_amount;

  // update billing status depending on applied_invoices
  const appliedSum = sumAppliedInvoices(e.applied_invoices);
  if (appliedSum <= 0) e.billing_status = "unbilled";
  else if (appliedSum >= e.total_amount) e.billing_status = "billed";
  else e.billing_status = "partially_billed";

  e.payment_mode = payload.payment_mode || e.payment_mode;
  e.updated_by = user_id;
  await e.save();
  return e.toObject();
};

export const deleteExpenseService = async ({
  tenant_id,
  user_id,
  expense_id,
  force = false,
}) => {
  if (!Types.ObjectId.isValid(expense_id))
    throw new Error("Invalid expense id");
  const e = await Expense.findOne({ _id: expense_id, tenant_id });
  if (!e) throw new Error("Expense not found");

  if (force) {
    await Expense.deleteOne({ _id: expense_id });
    return { hard: true };
  } else {
    e.archived = true;
    e.archived_at = new Date();
    e.updated_by = user_id;
    await e.save();
    return { hard: false, archived: e.toObject() };
  }
};

/**
 * Attach invoice to an expense (partial or full amount applied)
 * payload: { invoice_id, amount_applied }
 */
export const attachInvoiceToExpenseService = async ({
  tenant_id,
  user_id,
  expense_id,
  invoice_id,
  amount_applied,
}) => {
  if (!Types.ObjectId.isValid(expense_id))
    throw new Error("Invalid expense id");
  if (!Types.ObjectId.isValid(invoice_id))
    throw new Error("Invalid invoice id");

  const [e, inv] = await Promise.all([
    Expense.findOne({ _id: expense_id, tenant_id }),
    Invoice.findOne({ _id: invoice_id, tenant_id }),
  ]);

  if (!e) throw new Error("Expense not found");
  if (!inv) throw new Error("Invoice not found");

  const amt = Number(amount_applied || 0);
  if (amt <= 0) throw new Error("amount_applied must be > 0");

  // push applied entry
  const applied = {
    invoice: inv._id,
    invoice_no: inv.invoice_no || "",
    invoice_date: inv.date || null,
    invoice_amount: inv.total_amount || 0,
    amount_applied: amt,
  };

  e.applied_invoices = e.applied_invoices || [];
  e.applied_invoices.push(applied);

  const appliedSum = sumAppliedInvoices(e.applied_invoices);

  if (appliedSum <= 0) e.billing_status = "unbilled";
  else if (appliedSum >= e.total_amount) e.billing_status = "billed";
  else e.billing_status = "partially_billed";

  // optionally set top-level invoice if fully billed
  if (e.billing_status === "billed") e.invoice = inv._id;

  e.updated_by = user_id;
  await e.save();

  return e.toObject();
};

export const uploadFilesToExpenseService = async ({
  tenant_id,
  user_id,
  expense_id,
  files = [],
}) => {
  if (!Types.ObjectId.isValid(expense_id))
    throw new Error("Invalid expense id");

  const expense = await Expense.findOne({
    _id: expense_id,
    tenant_id,
  });

  if (!expense) throw new Error("Expense not found");

  const uploadedFiles = [];

  for (const file of files) {

    let upload;

    try {
      upload = await uploadFileToCloud(file.path, `expenses/${tenant_id}`);
    } finally {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    if (!upload.success) {
      throw new Error(upload.error);
    }

    uploadedFiles.push({
      key: upload.public_id,
      url: upload.url,
      name: upload.name,
      size: upload.size,
      mime: upload.mime,
      uploaded_at: new Date(),
      uploaded_by: user_id,
    });
  }

  expense.files = expense.files || [];
  expense.files.push(...uploadedFiles);

  expense.updated_by = user_id;

  await expense.save();

  return expense.toObject();
};

export const deleteExpenseFileService = async ({
  tenant_id,
  user_id,
  expense_id,
  file_id,
}) => {
  if (!Types.ObjectId.isValid(expense_id))
    throw new Error("Invalid expense id");

  const expense = await Expense.findOne({
    _id: expense_id,
    tenant_id,
  });

  if (!expense) throw new Error("Expense not found");

  const file = expense.files.find((f) => f.key === file_id);

  if (!file) throw new Error("File not found");

  // delete from cloudinary
  await cloudinary.uploader.destroy(file.key, {
    resource_type: "raw",
  });

  // remove from array
  expense.files = expense.files.filter((f) => f.key !== file_id);

  expense.updated_by = user_id;

  await expense.save();

  return expense.toObject();
};

export const exportExpensesService = async ({ tenant_id, filters = {} }) => {
  const result = await listExpensesService({
    tenant_id,
    page: 1,
    limit: 10000,
    filters,
  });
  return result.items;
};

// ------------------------- Expense Category -------------------------------

export const createExpenseCategoryService = async ({
  tenant_id,
  user_id,
  payload,
}) => {
  if (!payload.name) throw new Error("Category name required");

  const category = new ExpenseCategory({
    tenant_id,
    name: payload.name,
    description: payload.description || "",
    created_by: user_id,
    updated_by: user_id,
  });

  await category.save();

  return category.toObject();
};

export const listExpenseCategoriesService = async ({ tenant_id }) => {
  const categories = await ExpenseCategory.find({ tenant_id, is_active: true })
    .sort({ name: 1 })
    .lean();

  return categories;
};

export const updateExpenseCategoryService = async ({
  tenant_id,
  user_id,
  category_id,
  payload,
}) => {
  if (!Types.ObjectId.isValid(category_id))
    throw new Error("Invalid category id");

  const category = await ExpenseCategory.findOne({
    _id: category_id,
    tenant_id,
  });

  if (!category) throw new Error("Category not found");

  if (payload.name !== undefined) category.name = payload.name;
  if (payload.description !== undefined)
    category.description = payload.description;

  category.updated_by = user_id;

  await category.save();

  return category.toObject();
};

export const deleteExpenseCategoryService = async ({
  tenant_id,
  category_id,
}) => {
  if (!Types.ObjectId.isValid(category_id))
    throw new Error("Invalid category id");

  const category = await ExpenseCategory.findOne({
    _id: category_id,
    tenant_id,
  });

  if (!category) throw new Error("Category not found");

  category.is_active = false;

  await category.save();

  return true;
};

// ------------------------- Payment Mode -------------------------------

export const createPaymentModeService = async ({
  tenant_id,
  user_id,
  payload,
}) => {
  if (!payload.name) throw new Error("Payment mode name required");

  const mode = new PaymentMode({
    tenant_id,
    name: payload.name,
    description: payload.description || "",
    created_by: user_id,
    updated_by: user_id,
  });

  await mode.save();

  return mode.toObject();
};

export const listPaymentModesService = async ({ tenant_id }) => {
  return await PaymentMode.find({ tenant_id, is_active: true })
    .sort({ name: 1 })
    .lean();
};

export const updatePaymentModeService = async ({
  tenant_id,
  user_id,
  mode_id,
  payload,
}) => {
  const mode = await PaymentMode.findOne({
    _id: mode_id,
    tenant_id,
  });

  if (!mode) throw new Error("Payment mode not found");

  if (payload.name !== undefined) mode.name = payload.name;
  if (payload.description !== undefined) mode.description = payload.description;

  mode.updated_by = user_id;

  await mode.save();

  return mode.toObject();
};

export const deletePaymentModeService = async ({ tenant_id, mode_id }) => {
  const mode = await PaymentMode.findOne({
    _id: mode_id,
    tenant_id,
  });

  if (!mode) throw new Error("Payment mode not found");

  mode.is_active = false;

  await mode.save();

  return true;
};
