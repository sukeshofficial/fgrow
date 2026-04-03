import express from "express";
import * as controller from "../controller/invoice.controller.js";
import { validate } from "../validators/invoice.validator.js";
import authMiddleware from "../middleware/auth.middleware.js";
import billingMiddleware from "../middleware/billing.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

// Middleware groups
const authStaff = [authMiddleware, billingMiddleware, requireRole("owner", "staff")];
const authOwner = [authMiddleware, billingMiddleware, requireRole("owner")];
const authOwnerStaff = authStaff;

// Collection-level
router.get("/", ...authStaff, validate("list"), controller.listInvoices);
router.post("/", ...authStaff, validate("create"), controller.createInvoice);
router.get("/next-number", ...authStaff, controller.getNextInvoiceNumber);
router.get("/export", ...authOwner, validate("export"), controller.exportInvoices);
router.post("/bulk", ...authOwner, controller.bulkOperations);

// Single-invoice CRUD
router.get("/:id", ...authStaff, controller.getInvoiceById);
router.patch("/:id", ...authStaff, validate("update"), controller.updateInvoice);
router.delete("/:id", ...authStaff, controller.deleteInvoice);

// Items
router.post("/:id/items", ...authStaff, validate("addItems"), controller.addItems);
router.patch("/:id/items/:itemId", ...authStaff, validate("updateItem"), controller.updateItem);
router.delete("/:id/items/:itemId", ...authStaff, controller.deleteItem);

router.get("/unbilled-tasks/:clientId", ...authStaff, controller.getUnbilledTasks);

// Payments & status
router.post("/:id/payments", ...authStaff, validate("addPayment"), controller.addPayment);
router.get("/:id/payments", ...authStaff, controller.listPayments);
router.post("/:id/mark-paid", ...authStaff, controller.markPaid);

// Preview / Send / PDF
router.get("/:id/preview", ...authStaff, controller.previewInvoice);
router.post("/:id/send", ...authStaff, validate("send"), controller.sendInvoice);
router.get("/:id/pdf", ...authStaff, controller.getPdf);

// Utilities
router.post("/:id/reverse", ...authOwner, controller.reverseInvoice);

export default router;
