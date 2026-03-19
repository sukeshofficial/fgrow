import { api } from "./api";

/**
 * List services with pagination and filters
 * GET /services
 */
export const listServices = (params) => {
  return api.get("/services", { params });
};

/**
 * List all services for the current tenant (unpaginated)
 * GET /services/tenant-list
 */
export const listServicesByTenant = () => {
  return api.get("/services/tenant-list");
};

/**
 * Get service details by ID
 * GET /services/:id
 */
export const getServiceById = (id) => {
  return api.get(`/services/${id}`);
};

/**
 * Create a new service
 * POST /services
 */
export const createService = (payload) => {
  return api.post("/services", payload);
};

/**
 * Update service details
 * PATCH /services/:id
 */
export const updateService = (id, payload) => {
  return api.patch(`/services/${id}`, payload);
};

/**
 * Delete / Archive service
 * DELETE /services/:id
 */
export const deleteService = (id, force = false) => {
  return api.delete(`/services/${id}`, { params: { force } });
};
