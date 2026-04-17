import { api } from "./api";

export const listDocuments = (params) => api.get("/documents", { params });
export const createDocument = (data) => api.post("/documents", data);
export const getDocument = (id) => api.get(`/documents/${id}`);
export const updateDocument = (id, data) => api.patch(`/documents/${id}`, data);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const returnDocument = (id) => api.post(`/documents/${id}/return`);
export const exportDocuments = () => api.get("/documents/export", { responseType: "blob" });
