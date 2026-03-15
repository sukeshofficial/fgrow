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
} from "../controller/tenant.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

const authSuperAdmin = [authMiddleware, requireSuperAdmin];
const authOwner = [authMiddleware, requireRole("owner")];

// Create tenant (public endpoint guarded by auth + upload)
router.post("/create", authMiddleware, upload.single("companyLogo"), createTenant);

// Get pending tenants (super-admin only)
router.get("/pending", ...authSuperAdmin, getPendingTenants);

// Approve / reject tenant (super-admin only)
router.patch("/:tenantId/approve", ...authSuperAdmin, approveTenant);
router.patch("/:tenantId/reject", ...authSuperAdmin, rejectTenant);

// Re-appeal tenant (owner)
router.patch("/re-appeal", ...authOwner, reAppealTenant);

export default router;
