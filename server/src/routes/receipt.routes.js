// routes/receipt.routes.js
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
} from "../controller/receipt.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

// CRUD
router.post("/", authMiddleware, requireRole("owner", "staff"), createReceiptController);
router.get("/", authMiddleware, requireRole("owner", "staff"), listReceiptsController);

// utility: get unallocated invoices for client (used to render "Settle invoices" table)
// NOTE: this route must be defined before `/:id` to avoid route conflicts
router.get("/client/:clientId/unpaid-invoices", authMiddleware, requireRole("owner", "staff"), unpaidInvoicesForClientController);

// Print / preview    
router.get("/:id/print", authMiddleware, requireRole("owner", "staff", "user"), printReceiptController);

// read single
router.get("/:id", authMiddleware, requireRole("owner", "staff", "user"), getReceiptController);
router.patch("/:id", authMiddleware, requireRole("owner", "staff"), updateReceiptController);
router.delete("/:id", authMiddleware, requireRole("owner", "staff"), deleteReceiptController);

// applying to invoices
router.post("/:id/apply", authMiddleware, requireRole("owner", "staff"), applyToInvoicesController); // body: { allocations: [{ invoiceId, amount }] }
router.post("/:id/auto-apply", authMiddleware, requireRole("owner", "staff"), autoApplyController); // auto-apply algorithm
router.post("/:id/unapply", authMiddleware, requireRole("owner", "staff"), unapplyReceiptController); // body: { invoiceIds: [..] }

export default router;