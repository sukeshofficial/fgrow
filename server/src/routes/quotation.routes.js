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
  getNextQuotationNumber,
  resetQuotationCounter,
} from "../controller/quotation.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";
import { cacheMiddleware, clearCacheMiddleware } from "../middleware/cache.js";


const router = express.Router();
const authStaff = [authMiddleware, requireRole("owner", "staff")];

router.post("/", ...authStaff, clearCacheMiddleware("v0/quotations"), createQuotationController);
router.get("/", ...authStaff, cacheMiddleware(300), listQuotationsController);
router.get("/:id", ...authStaff, cacheMiddleware(300), getQuotationController);
router.patch("/:id", ...authStaff, clearCacheMiddleware("v0/quotations"), updateQuotationController);
router.delete("/:id", ...authStaff, clearCacheMiddleware("v0/quotations"), deleteQuotationController);


// status change
router.post("/:id/status", ...authStaff, clearCacheMiddleware("v0/quotations"), changeQuotationStatusController);

// convert to invoice
router.post("/:id/convert-to-invoice", ...authStaff, clearCacheMiddleware(["v0/quotations", "v0/invoices"]), convertQuotationToInvoiceController);


// preview/pdf/send
router.get("/:id/preview", authMiddleware, requireRole("owner", "staff", "user"), previewQuotationController);
router.post("/:id/send", authMiddleware, requireRole("owner", "staff", "user"), sendQuotationController);

// Counter utility
router.get("/utility/next-number", ...authStaff, getNextQuotationNumber);
router.post("/utility/reset-counter", ...authStaff, resetQuotationCounter);

export default router;