import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
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
} from "../controller/tenant.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

const authSuperAdmin = [authMiddleware, requireSuperAdmin];
const authOwner = [authMiddleware, requireRole("owner")];

// Create tenant (public endpoint guarded by auth + upload)
router.post("/create", authMiddleware, upload.single("companyLogo"), createTenant);

// GET ALL tenants (super-admin only)
router.get("/all", ...authSuperAdmin, getAllTenants);

// GET single tenant details (super-admin only)
router.get("/detail/:tenantId", ...authSuperAdmin, getTenantById);

// GET targeted tenant staff (super-admin only)
router.get("/detail/:tenantId/staff", ...authSuperAdmin, getTenantStaffAdmin);

// GET targeted tenant clients (super-admin only)
router.get("/detail/:tenantId/clients", ...authSuperAdmin, getTenantClientsAdmin);

// Get pending tenants (super-admin only)
router.get("/pending", ...authSuperAdmin, getPendingTenants);

// Approve / reject tenant (super-admin only)
router.patch("/:tenantId/approve", ...authSuperAdmin, approveTenant);
router.patch("/:tenantId/reject", ...authSuperAdmin, rejectTenant);

// Re-appeal tenant (owner)
router.patch("/re-appeal", ...authOwner, reAppealTenant);

// Get tenant staff (owner only presumably, or staff too?)
// The plan said ...authOwner, so only owner can see the full list of joiners.
router.get("/staff", ...authOwner, getTenantStaff);

export default router;
