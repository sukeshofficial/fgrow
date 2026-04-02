import express from "express";
import {
  createReceiptController,
  listReceiptsController,
  getReceiptController,
  updateReceiptController,
  deleteReceiptController,
  applyToInvoicesController,
  autoApplyController,
  unapplyReceiptController,
  unpaidInvoicesForClientController,
  printReceiptController,
  sendReceiptController,
} from "../controller/receipt.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

const authStaff = [authMiddleware, requireRole("owner", "staff")];
const authOwnerStaffUser = [authMiddleware, requireRole("owner", "staff", "user")];

// CRUD
router.post("/", ...authStaff, createReceiptController);
router.get("/", ...authStaff, listReceiptsController);

// Utility (must be before /:id to avoid conflicts)
router.get("/client/:clientId/unpaid-invoices", ...authStaff, unpaidInvoicesForClientController);

// Print / preview / send
router.get("/:id/print", ...authOwnerStaffUser, printReceiptController);
router.post("/:id/send", ...authStaff, sendReceiptController);

// Read single / update / delete
router.get("/:id", ...authOwnerStaffUser, getReceiptController);
router.patch("/:id", ...authStaff, updateReceiptController);
router.delete("/:id", ...authStaff, deleteReceiptController);

// Applying to invoices
router.post("/:id/apply", ...authStaff, applyToInvoicesController);
router.post("/:id/auto-apply", ...authStaff, autoApplyController);
router.post("/:id/unapply", ...authStaff, unapplyReceiptController);

export default router;