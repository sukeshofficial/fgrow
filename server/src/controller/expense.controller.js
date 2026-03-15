import {
  createExpenseService,
  listExpensesService,
  getExpenseByIdService,
  updateExpenseService,
  deleteExpenseService,
  attachInvoiceToExpenseService,
  uploadFilesToExpenseService,
  deleteExpenseFileService,
  exportExpensesService,
  createExpenseCategoryService,
  listExpenseCategoriesService,
  updateExpenseCategoryService,
  deleteExpenseCategoryService,
  createPaymentModeService,
  listPaymentModesService,
  updatePaymentModeService,
  deletePaymentModeService,
} from "../services/expense.service.js";

export const createExpenseController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const payload = req.body;
    const created = await createExpenseService({ tenant_id, user_id, payload });
    return res.status(201).json({ success: true, data: created });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const listExpensesController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { page = 1, limit = 20, search, ...filters } = req.query;
    const result = await listExpensesService({
      tenant_id,
      page: Number(page),
      limit: Number(limit),
      filters,
      search,
    });
    return res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getExpenseController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const expenseId = req.params.id;
    const e = await getExpenseByIdService({ tenant_id, expense_id: expenseId });
    return res.json({ success: true, data: e });
  } catch (e) {
    return res.status(404).json({ success: false, message: e.message });
  }
};

export const updateExpenseController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const expenseId = req.params.id;
    const payload = req.body;
    const updated = await updateExpenseService({
      tenant_id,
      user_id,
      expense_id: expenseId,
      payload,
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const deleteExpenseController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const expenseId = req.params.id;
    const force = req.query.force === "true";
    const result = await deleteExpenseService({
      tenant_id,
      user_id,
      expense_id: expenseId,
      force,
    });
    return res.json({
      success: true,
      message: result.hard ? "Expense deleted" : "Expense archived",
    });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const attachInvoiceController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const expenseId = req.params.id;
    const { invoice, amount_applied } = req.body;
    const updated = await attachInvoiceToExpenseService({
      tenant_id,
      user_id,
      expense_id: expenseId,
      invoice_id: invoice,
      amount_applied,
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const uploadExpenseFilesController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;
    const expense_id = req.params.id;

    const result = await uploadFilesToExpenseService({
      tenant_id,
      user_id,
      expense_id,
      files: req.files,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteExpenseFileController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const expense_id = req.params.id;
    const file_id = req.params.fileId;

    const result = await deleteExpenseFileService({
      tenant_id,
      user_id,
      expense_id,
      file_id,
    });

    return res.json({
      success: true,
      message: "File deleted successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const exportExpensesController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const filters = req.body || {};
    const items = await exportExpensesService({ tenant_id, filters });
    // controller can convert items to CSV/XLSX and stream the file.
    return res.json({ success: true, data: items });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ------------------------- Expense Category -------------------------------

export const createExpenseCategoryController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const category = await createExpenseCategoryService({
      tenant_id,
      user_id,
      payload: req.body,
    });

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const listExpenseCategoriesController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    const categories = await listExpenseCategoriesService({ tenant_id });

    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExpenseCategoryController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const category = await updateExpenseCategoryService({
      tenant_id,
      user_id,
      category_id: req.params.id,
      payload: req.body,
    });

    return res.json({ success: true, data: category });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteExpenseCategoryController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    await deleteExpenseCategoryService({
      tenant_id,
      category_id: req.params.id,
    });

    return res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ------------------------- Expense Category -------------------------------

export const createPaymentModeController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const result = await createPaymentModeService({
      tenant_id,
      user_id,
      payload: req.body,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listPaymentModesController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    const result = await listPaymentModesService({ tenant_id });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaymentModeController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const user_id = req.user._id;

    const result = await updatePaymentModeService({
      tenant_id,
      user_id,
      mode_id: req.params.id,
      payload: req.body,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePaymentModeController = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;

    await deletePaymentModeService({
      tenant_id,
      mode_id: req.params.id,
    });

    res.json({ success: true, message: "Payment mode deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
