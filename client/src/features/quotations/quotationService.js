import { api } from "../../api/api";

const quotationService = {
    listQuotations: async (params = {}) => {
        const response = await api.get("/quotations", { params });
        return response.data;
    },

    getQuotation: async (id) => {
        const response = await api.get(`/quotations/${id}`);
        return response.data;
    },

    createQuotation: async (data) => {
        const response = await api.post("/quotations", data);
        return response.data;
    },

    updateQuotation: async (id, data) => {
        const response = await api.patch(`/quotations/${id}`, data);
        return response.data;
    },

    deleteQuotation: async (id, force = false) => {
        const response = await api.delete(`/quotations/${id}`, { params: { force } });
        return response.data;
    },

    changeStatus: async (id, status) => {
        const response = await api.post(`/quotations/${id}/status`, { status });
        return response.data;
    },

    convertToInvoice: async (id, data = {}) => {
        const response = await api.post(`/quotations/${id}/convert-to-invoice`, data);
        return response.data;
    },

    sendQuotation: async (id, data) => {
        const response = await api.post(`/quotations/${id}/send`, data);
        return response.data;
    },

    getPreviewUrl: (id) => {
        const baseURL = api.defaults.baseURL || "http://localhost:5000/api/v0";
        return `${baseURL}/quotations/${id}/preview`;
    },

    printQuotation: async (id) => {
        return await api.get(`/quotations/${id}/preview`, { responseType: 'blob' });
    },

    getNextNumber: async () => {
        const response = await api.get("/quotations/utility/next-number");
        return response.data;
    },

    resetCounter: async (seq, yearStr) => {
        const response = await api.post("/quotations/utility/reset-counter", { seq, yearStr });
        return response.data;
    }
};

export default quotationService;
