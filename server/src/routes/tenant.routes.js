import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import billingMiddleware from "../middleware/billing.middleware.js";
import { requireSuperAdmin } from "../middleware/superAdmin.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";
import {
  createTenant,
  getPendingTenants,
  approveTenant,
  rejectTenant,
  reAppealTenant,
  getTenantStaff,
  getAllTenants,
  getTenantById,
  getTenantStaffAdmin,
  getTenantClientsAdmin,
  removeUserFromTenant,
  updateTenant,
  removeLogo,
} from "../controller/tenant.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import { cacheMiddleware, clearCacheMiddleware } from "../middleware/cache.js";


const router = express.Router();

const authSuperAdmin = [authMiddleware, requireSuperAdmin]; // Super admins skip billing check usually, or we can add it if needed. My middleware already skips super_admin.
const authOwner = [authMiddleware, billingMiddleware, requireRole("owner")];
const authStandard = [authMiddleware, billingMiddleware];

// Create tenant (public endpoint guarded by auth + upload)
router.post("/create", authMiddleware, clearCacheMiddleware("v0/tenant"), upload.single("companyLogo"), createTenant);

// Update tenant (owner only)
router.patch("/update", ...authOwner, upload.single("logo"), clearCacheMiddleware("v0/tenant"), updateTenant);
router.delete("/logo", ...authOwner, clearCacheMiddleware("v0/tenant"), removeLogo);


// GET ALL tenants (super-admin only)
router.get("/all", ...authSuperAdmin, cacheMiddleware(600), getAllTenants);


// GET single tenant details (authorized users only)
router.get("/detail/:tenantId", ...authStandard, cacheMiddleware(300), getTenantById);


// GET targeted tenant staff (super-admin only)
router.get("/detail/:tenantId/staff", ...authSuperAdmin, getTenantStaffAdmin);

// GET targeted tenant clients (super-admin only)
router.get("/detail/:tenantId/clients", ...authSuperAdmin, getTenantClientsAdmin);

// Get pending tenants (super-admin only)
router.get("/pending", ...authSuperAdmin, getPendingTenants);

// Approve / reject tenant (super-admin only)
router.patch("/:tenantId/approve", ...authSuperAdmin, clearCacheMiddleware("v0/tenant"), approveTenant);
router.patch("/:tenantId/reject", ...authSuperAdmin, clearCacheMiddleware("v0/tenant"), rejectTenant);

// Re-appeal tenant (owner)
router.patch("/re-appeal", ...authOwner, clearCacheMiddleware("v0/tenant"), reAppealTenant);


// Get tenant staff (owner and staff)
router.get("/staff", ...authStandard, requireRole("owner", "staff"), cacheMiddleware(300), getTenantStaff);

// Remove user from tenant (owner only)
router.patch("/:userId/remove", ...authOwner, clearCacheMiddleware("v0/tenant"), removeUserFromTenant);


export default router;
