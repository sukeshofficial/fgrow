import express from "express";
import {
  createQuotationController,
  listQuotationsController,
  getQuotationController,
  updateQuotationController,
  deleteQuotationController,
  changeQuotationStatusController,
  convertQuotationToInvoiceController,
  previewQuotationController,
  sendQuotationController,
} from "../controller/quotation.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();
const authStaff = [authMiddleware, requireRole("owner", "staff")];

router.post("/", ...authStaff, createQuotationController);
router.get("/", ...authStaff, listQuotationsController);
router.get("/:id", ...authStaff, getQuotationController);
router.patch("/:id", ...authStaff, updateQuotationController);
router.delete("/:id", ...authStaff, deleteQuotationController);

// status change
router.post("/:id/status", ...authStaff, changeQuotationStatusController);

// convert to invoice
router.post("/:id/convert-to-invoice", ...authStaff, convertQuotationToInvoiceController);

// preview/pdf/send
router.get("/:id/preview", authMiddleware, requireRole("owner", "staff", "user"), previewQuotationController);
router.post("/:id/send", authMiddleware, requireRole("owner", "staff", "user"), sendQuotationController);

export default router;