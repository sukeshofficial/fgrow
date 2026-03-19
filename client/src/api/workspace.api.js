import { api } from "./api";

/**
 * This service handles Invoices, Receipts, and Quotations (Workspace Finance)
 */

// --- INVOICES ---
export const listInvoices = (params) => api.get("/invoice", { params });
export const createInvoice = (payload) => api.post("/invoice", payload);
export const getInvoice = (id) => api.get(`/invoice/${id}`);
export const updateInvoice = (id, payload) => api.patch(`/invoice/${id}`, payload);
export const deleteInvoice = (id) => api.delete(`/invoice/${id}`);

// --- QUOTATIONS ---
export const listQuotations = (params) => api.get("/quotation", { params });
export const createQuotation = (payload) => api.post("/quotation", payload);
export const getQuotation = (id) => api.get(`/quotation/${id}`);
export const updateQuotation = (id, payload) => api.patch(`/quotation/${id}`, payload);
export const deleteQuotation = (id) => api.delete(`/quotation/${id}`);

// --- RECEIPTS ---
export const listReceipts = (params) => api.get("/receipt", { params });
export const createReceipt = (payload) => api.post("/receipt", payload);
export const getReceipt = (id) => api.get(`/receipt/${id}`);
export const updateReceipt = (id, payload) => api.patch(`/receipt/${id}`, payload);
export const deleteReceipt = (id) => api.delete(`/receipt/${id}`);
