import { api } from "../../api/api";

const BASE_URL = "/invoices";

// A. CRUD & listing
export const getInvoices = async (params = {}) => {
  return await api.get(BASE_URL, { params });
};

export const getInvoiceById = async (id) => {
  return await api.get(`${BASE_URL}/${id}`);
};

export const createInvoice = async (invoiceData) => {
  return await api.post(BASE_URL, invoiceData);
};

export const updateInvoice = async (id, invoiceData) => {
  return await api.patch(`${BASE_URL}/${id}`, invoiceData);
};

export const deleteInvoice = async (id, force = false) => {
  return await api.delete(`${BASE_URL}/${id}?force=${force}`);
};

export const bulkDeleteInvoices = async (ids, force = false) => {
  return await api.post(`${BASE_URL}/bulk`, { action: "delete", ids, force });
};

export const getNextInvoiceNumber = async () => {
  return await api.get(`${BASE_URL}/next-number`);
};

export const resetInvoiceCounter = async (seq, yearStr) => {
  return await api.post(`${BASE_URL}/reset-counter`, { seq, yearStr });
};

// B. Items
export const addItems = async (id, items) => {
  return await api.post(`${BASE_URL}/${id}/items`, { items });
};

export const updateItem = async (id, itemId, itemData) => {
  return await api.patch(`${BASE_URL}/${id}/items/${itemId}`, itemData);
};

export const deleteItem = async (id, itemId) => {
  return await api.delete(`${BASE_URL}/${id}/items/${itemId}`);
};

export const getUnbilledTasks = async (clientId) => {
  return await api.get(`${BASE_URL}/unbilled-tasks/${clientId}`);
};

// C. Payments
export const addPayment = async (id, paymentData) => {
  return await api.post(`${BASE_URL}/${id}/payments`, paymentData);
};

export const getPayments = async (id) => {
  return await api.get(`${BASE_URL}/${id}/payments`);
};

export const markPaid = async (id) => {
  return await api.post(`${BASE_URL}/${id}/mark-paid`);
};

// D. Preview / PDF / Send / Export
export const previewInvoice = async (id) => {
  return await api.get(`${BASE_URL}/${id}/preview`);
};

export const sendInvoice = async (id, data = {}) => {
  return await api.post(`${BASE_URL}/${id}/send`, data);
};

export const getPdf = async (id) => {
  return await api.get(`${BASE_URL}/${id}/pdf`, { responseType: 'blob' });
};

export const exportInvoices = async (params = {}) => {
  return await api.get(`${BASE_URL}/export`, { params, responseType: 'blob' });
};

// E. Bulk & reverse
export const bulkOperations = async (data) => {
  return await api.post(`${BASE_URL}/bulk-ops`, data);
};

export const reverseInvoice = async (id) => {
  return await api.post(`${BASE_URL}/${id}/reverse`);
};

export const getInvoiceStats = async () => {
  return await api.get(`${BASE_URL}/stats`);
};
