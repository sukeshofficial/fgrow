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

router.post(
  "/create",
  authMiddleware,
  requireSuperAdmin,
  upload.single("companyLogo"),
  createTenant,
);

router.get("/pending", authMiddleware, requireSuperAdmin, getPendingTenants);

// Approve tenant
router.patch(
  "/:tenantId/approve",
  authMiddleware,
  requireSuperAdmin,
  approveTenant,
);

// Reject tenant
router.patch(
  "/:tenantId/reject",
  authMiddleware,
  requireSuperAdmin,
  rejectTenant,
);

// Re-appeal tenant
router.patch(
  "/re-appeal",
  authMiddleware,
  requireRole("owner"),
  reAppealTenant,
);

export default router;
