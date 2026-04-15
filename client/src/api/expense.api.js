import { api } from "./api";

/**
 * Create a new expense
 * POST /expense
 */
export const createExpense = (payload) => {
  return api.post("/expenses", payload);
};

/**
 * List expenses with filters
 * GET /expenses
 */
export const listExpenses = (params) => {
  return api.get("/expenses", { params });
};

/**
 * Get expense details
 * GET /expenses/:id
 */
export const getExpense = (id) => {
  return api.get(`/expenses/${id}`);
};

/**
 * Update expense
 * PATCH /expenses/:id
 */
export const updateExpense = (id, payload) => {
  return api.patch(`/expenses/${id}`, payload);
};

/**
 * Delete expense
 * DELETE /expenses/:id
 */
export const deleteExpense = (id) => {
  return api.delete(`/expenses/${id}`);
};

/**
 * List expense categories
 * GET /expenses/categories
 */
export const listExpenseCategories = () => {
  return api.get("/expenses/categories");
};

/**
 * List payment modes
 * GET /expenses/payment-modes
 */
export const listPaymentModes = () => {
  return api.get("/expenses/payment-modes");
};

/**
 * Create expense category
 * POST /expenses/categories
 */
export const createExpenseCategory = (payload) => {
  return api.post("/expenses/categories", payload);
};

/**
 * Create payment mode
 * POST /expenses/payment-modes
 */
export const createPaymentMode = (payload) => {
  return api.post("/expenses/payment-modes", payload);
};

/**
 * Get next expense number
 */
export const getNextNumber = (date) => {
  return api.get("/expenses/next-number", { params: { date } });
};

/**
 * Reset expense counter
 */
export const resetCounter = (nextSeq, fy) => {
  return api.post("/expenses/reset-counter", { nextSeq, fy });
};

/**
 * Upload expense files
 * POST /expenses/:id/files
 */
export const uploadExpenseFiles = (id, formData) => {
  return api.post(`/expenses/${id}/files`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Delete expense file
 * DELETE /expenses/:id/files/:fileId
 */
export const deleteExpenseFile = (id, fileId) => {
  return api.delete(`/expenses/${id}/files`, { params: { fileId } });
};
