import { api } from "./api";

/**
 * Create a new expense
 * POST /expense
 */
export const createExpense = (payload) => {
  return api.post("/expense", payload);
};

/**
 * List expenses with filters
 * GET /expense
 */
export const listExpenses = (params) => {
  return api.get("/expense", { params });
};

/**
 * Get expense details
 * GET /expense/:id
 */
export const getExpense = (id) => {
  return api.get(`/expense/${id}`);
};

/**
 * Update expense
 * PATCH /expense/:id
 */
export const updateExpense = (id, payload) => {
  return api.patch(`/expense/${id}`, payload);
};

/**
 * Delete expense
 * DELETE /expense/:id
 */
export const deleteExpense = (id) => {
  return api.delete(`/expense/${id}`);
};

/**
 * List expense categories
 * GET /expense/categories
 */
export const listExpenseCategories = () => {
  return api.get("/expense/categories");
};

/**
 * List payment modes
 * GET /expense/payment-modes
 */
export const listPaymentModes = () => {
  return api.get("/expense/payment-modes");
};

/**
 * Upload expense files
 * POST /expense/:id/files
 */
export const uploadExpenseFiles = (id, formData) => {
  return api.post(`/expense/${id}/files`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
