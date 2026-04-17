import { api } from "./api";

export const listDocumentTypes = (params) => api.get("/document-types", { params });
export const createDocumentType = (data) => api.post("/document-types", data);
export const updateDocumentType = (id, data) => api.put(`/document-types/${id}`, data);
export const deleteDocumentType = (id) => api.delete(`/document-types/${id}`);
