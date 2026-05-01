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
  getNextReceiptNumberController,
  resetReceiptCounterController,
  getReceiptStatsController,
} from "../controller/receipt.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";
import { cacheMiddleware, clearCacheMiddleware } from "../middleware/cache.js";


const router = express.Router();

const authStaff = [authMiddleware, requireRole("owner", "staff")];
const authOwnerStaffUser = [authMiddleware, requireRole("owner", "staff", "user")];

// CRUD
router.post("/", ...authStaff, clearCacheMiddleware("v0/receipts"), createReceiptController);
router.get("/", ...authStaff, cacheMiddleware(300), listReceiptsController);


// Utility (must be before /:id to avoid conflicts)
router.get("/next-number", ...authStaff, getNextReceiptNumberController);
router.get("/stats", ...authStaff, cacheMiddleware(300), getReceiptStatsController);
router.post("/reset-counter", ...authStaff, resetReceiptCounterController);
router.get("/client/:clientId/unpaid-invoices", ...authStaff, unpaidInvoicesForClientController);

// Print / preview / send
router.get("/:id/print", ...authOwnerStaffUser, printReceiptController);
router.post("/:id/send", ...authStaff, sendReceiptController);

// Read single / update / delete
router.get("/:id", ...authOwnerStaffUser, cacheMiddleware(300), getReceiptController);
router.patch("/:id", ...authStaff, clearCacheMiddleware("v0/receipts"), updateReceiptController);
router.delete("/:id", ...authStaff, clearCacheMiddleware("v0/receipts"), deleteReceiptController);

// Applying to invoices
router.post("/:id/apply", ...authStaff, clearCacheMiddleware(["v0/receipts", "v0/invoices"]), applyToInvoicesController);
router.post("/:id/auto-apply", ...authStaff, clearCacheMiddleware(["v0/receipts", "v0/invoices"]), autoApplyController);
router.post("/:id/unapply", ...authStaff, clearCacheMiddleware(["v0/receipts", "v0/invoices"]), unapplyReceiptController);


export default router;