import express from "express";
import * as controller from "../controller/invoice.controller.js";
import { validate } from "../validators/invoice.validator.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

// A. CRUD & listing
router.get(
  "/",
  authMiddleware,  
  requireRole("owner", "staff"),
  validate("list"),
  controller.listInvoices,
);

router.post(
  "/",
  authMiddleware,
  requireRole("owner", "staff"),
  validate("create"),
  controller.createInvoice,
);

router.get(
  "/next-number",
  authMiddleware,
  requireRole("owner", "staff"),
  controller.getNextInvoiceNumber,
);

router.get(
  "/:id",
  authMiddleware,
  requireRole("owner", "staff"),
  controller.getInvoiceById,
);

router.patch(
  "/:id",
  authMiddleware,
  requireRole("owner", "staff"),
  validate("update"),
  controller.updateInvoice,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("owner"),
  controller.deleteInvoice,
);

// B. Items
router.post(
  "/:id/items",
  authMiddleware,
  requireRole("owner", "staff"),
  validate("addItems"),
  controller.addItems,
);

router.patch(
  "/:id/items/:itemId",
  authMiddleware,
  requireRole("owner", "staff"),
  validate("updateItem"),
  controller.updateItem,
);

router.delete(
  "/:id/items/:itemId",
  authMiddleware,
  requireRole("owner", "staff"),
  controller.deleteItem,
);

router.get(
  "/:id/unbilled-tasks",
  authMiddleware,
  requireRole("owner", "staff"),
  controller.getUnbilledTasks,
);

// C. Payments & status
router.post(
  "/:id/payments",
  authMiddleware,
  requireRole("owner", "staff"),
  validate("addPayment"),
  controller.addPayment,
);

router.get(
  "/:id/payments",
  authMiddleware,
  requireRole("owner", "staff"),
  controller.listPayments,
);

router.post(
  "/:id/mark-paid",
  authMiddleware,
  requireRole("owner", "staff"),
  controller.markPaid,
);

// D. Preview / Send / PDF / export
router.get(
  "/:id/preview",
  authMiddleware,
  requireRole("owner", "staff"),
  controller.previewInvoice,
);

router.post(
  "/:id/send",
  authMiddleware,
  requireRole("owner"),
  validate("send"),
  controller.sendInvoice,
);

router.get(
  "/:id/pdf",
  authMiddleware,
  requireRole("owner", "staff"),
  controller.getPdf,
);

router.get(
  "/export",
  authMiddleware,
  requireRole("owner"),
  validate("export"),
  controller.exportInvoices,
);

// E. Bulk / utilities
router.post(
  "/bulk",
  authMiddleware,
  requireRole("owner"),
  controller.bulkOperations,
);

router.post(
  "/:id/reverse",
  authMiddleware,
  requireRole("owner"),
  controller.reverseInvoice,
);

export default router;
