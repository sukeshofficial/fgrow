import { api } from "./api";

export const listCollectionRequests = (params) => api.get("/collection-requests", { params });
export const createCollectionRequest = (data) => api.post("/collection-requests", data);
export const getCollectionRequest = (id) => api.get(`/collection-requests/${id}`);
export const updateCollectionRequest = (id, data) => api.patch(`/collection-requests/${id}`, data);
export const deleteCollectionRequest = (id) => api.delete(`/collection-requests/${id}`);
export const attachDocumentsToRequest = (id, formData) => api.post(`/collection-requests/${id}/documents`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const removeDocumentFromRequest = (id, fileId) => api.delete(`/collection-requests/${id}/documents/${fileId}`);
export const changeCollectionRequestStatus = (id, status) => api.post(`/collection-requests/${id}/status`, { status });
