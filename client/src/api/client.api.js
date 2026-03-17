import { api } from "./api";

/**
 * Create a new client
 * POST /client
 */
export const createClient = (payload) => {
  return api.post("/client", payload);
};

/**
 * List clients with pagination and filters
 * GET /client
 */
export const listClients = (params) => {
  return api.get("/client", { params });
};

/**
 * Get client details by ID
 * GET /client/:id
 */
export const getClientById = (id) => {
  return api.get(`/client/${id}`);
};

/**
 * Update client details
 * PATCH /client/:id
 */
export const updateClient = (id, payload) => {
  return api.patch(`/client/${id}`, payload);
};

/**
 * Delete / Archive client
 * DELETE /client/:id
 */
export const deleteClient = (id, force = false) => {
  return api.delete(`/client/${id}`, { params: { force } });
};
