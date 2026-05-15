import { api } from "./api";

/**
 * Create Tenant
 */
export const createTenant = async (formData) => {
  return api.post("/tenant/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
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

/**
 * Get Tenant Staff List
 */
export const getTenantStaff = () => {
  return api.get("/tenant/staff");
};

/**
 * Super Admin: Get All Tenants
 */
export const getAllTenants = (status) => {
  return api.get("/tenant/all", { params: { status } });
};

/**
 * Super Admin: Get Tenant Details
 */
export const getTenantById = (tenantId) => {
  return api.get(`/tenant/detail/${tenantId}`);
};

/**
 * Super Admin: Get Tenant Staff (Admin)
 */
export const getTenantStaffAdmin = (tenantId) => {
  return api.get(`/tenant/detail/${tenantId}/staff`);
};

/**
 * Super Admin: Get Tenant Clients (Admin)
 */
export const getTenantClientsAdmin = (tenantId) => {
  return api.get(`/tenant/detail/${tenantId}/clients`);
};

/**
 * Verify GSTIN (Real-time lookup)
 */
export const verifyGSTIN = (gstin) => {
  return api.get(`/tenant/verify-gstin/${gstin}`);
};

/**
 * Super Admin: Mark GST as verified
 */
export const verifyGstAdmin = (id) => {
  return api.patch(`/tenant/${id}/verify-gst-admin`);
};

/**
 * Super Admin: Restrict or lift access for a tenant
 * @param {string} tenantId
 * @param {{ restricted: boolean, gracePeriodDays?: number }} data
 */
export const setTenantRestriction = (tenantId, data) => {
  return api.patch(`/tenant/${tenantId}/restrict`, data);
};

/**
 * Super Admin: Update grace period days for a tenant
 * @param {string} tenantId
 * @param {number} gracePeriodDays
 */
export const updateTenantGracePeriod = (tenantId, gracePeriodDays) => {
  return api.patch(`/tenant/${tenantId}/grace-period`, { gracePeriodDays });
};

/**
 * Super Admin: Update billing details for a tenant
 * @param {string} tenantId
 * @param {object} data { paymentStatus, lastPaymentAmount, lastPaymentDate }
 */
export const updateTenantBilling = (tenantId, data) => {
  return api.patch(`/tenant/${tenantId}/billing`, data);
};