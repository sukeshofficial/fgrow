import { api } from "../../api/api.js";

const BASE_URL = "/receipts";

const receiptService = {
    /**
     * Get the next auto-generated receipt number
     */
    getNextReceiptNumber: async () => {
        const response = await api.get(`${BASE_URL}/next-number`);
        return response.data;
    },

    resetReceiptCounter: async (seq, yearStr) => {
        const response = await api.post(`${BASE_URL}/reset-counter`, { seq, yearStr });
        return response.data;
    },

    /**
     * List all receipts with pagination and filters
     */
    listReceipts: async ({ page = 1, limit = 20, search = "", ...filters } = {}) => {
        const params = { page, limit, search, ...filters };
        const response = await api.get(BASE_URL, { params });
        return response.data;
    },

    /**
     * Get total receipt by ID
     */
    getReceipt: async (id) => {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Create a new receipt
     */
    createReceipt: async (payload) => {
        const response = await api.post(BASE_URL, payload);
        return response.data;
    },

    /**
     * Update an existing receipt
     */
    updateReceipt: async (id, payload) => {
        const response = await api.patch(`${BASE_URL}/${id}`, payload);
        return response.data;
    },

    /**
     * Delete or Archive a receipt
     */
    deleteReceipt: async (id, force = false) => {
        const response = await api.delete(`${BASE_URL}/${id}`, { params: { force } });
        return response.data;
    },

    /**
     * Apply receipt amount to specific invoices
     * allocations = [{ invoiceId, amount }]
     */
    applyToInvoices: async (id, allocations) => {
        const response = await api.post(`${BASE_URL}/${id}/apply`, { allocations });
        return response.data;
    },

    /**
     * Automatically apply receipt to oldest invoices
     */
    autoApply: async (id) => {
        const response = await api.post(`${BASE_URL}/${id}/auto-apply`);
        return response.data;
    },

    /**
     * Unapply receipt from specific invoices
     */
    unapplyReceipt: async (id, invoiceIds) => {
        const response = await api.post(`${BASE_URL}/${id}/unapply`, { invoiceIds });
        return response.data;
    },

    /**
     * List unpaid invoices for a specific client
     */
    getUnpaidInvoices: async (clientId, { page = 1, limit = 100, minAmount = 0 } = {}) => {
        const response = await api.get(`${BASE_URL}/client/${clientId}/unpaid-invoices`, {
            params: { page, limit, minAmount },
        });
        return response.data;
    },

    /**
     * Generate/Download PDF for a receipt
     */
    printReceipt: async (id) => {
        return await api.get(`${BASE_URL}/${id}/print`, {
            responseType: "blob",
        });
    },

    /**
     * Send receipt via email
     */
    sendReceipt: async (id, data) => {
        const response = await api.post(`${BASE_URL}/${id}/send`, data);
        return response.data;
    },
};

export default receiptService;
