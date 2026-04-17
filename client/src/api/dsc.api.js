import { api } from "./api";

export const listDsc = (params) => api.get("/dsc", { params });
export const createDsc = (data) => api.post("/dsc", data);
export const getDsc = (id) => api.get(`/dsc/${id}`);
export const updateDsc = (id, data) => api.patch(`/dsc/${id}`, data);
export const deleteDsc = (id) => api.delete(`/dsc/${id}`);
