import { api } from "./api";

/**
 * Create Tenant
 */
export const createTenant = (payload) => {
  return api.post("/tenant/create", payload);
};

/**
 * Get Pending Tenants (Super Admin)
 */
export const getPendingTenants = () => {
  return api.get("/tenant/pending");
};

/**
 * Approve Tenant
 */
export const approveTenant = (tenantId) => {
  return api.patch(`/tenant/${tenantId}/approve`);
};

/**
 * Reject Tenant
 */
export const rejectTenant = (tenantId, reason) => {
  return api.patch(`/tenant/${tenantId}/reject`, { reason });
};

/**
 * Re-appeal Tenant
 */
export const reAppealTenant = (payload) => {
  return api.patch("/tenant/re-appeal", payload);
};