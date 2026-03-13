// routes/quotation.routes.js
import express from "express";
import {
    createQuotationController,
    listQuotationsController,
    getQuotationController,
    updateQuotationController,
    deleteQuotationController,
    changeQuotationStatusController,
    convertQuotationToInvoiceController
} from "../controllers/quotation.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

// CRUD + list
router.post("/", authMiddleware, requireRole("owner", "staff"), createQuotationController);
router.get("/", authMiddleware, requireRole("owner", "staff", "user"), listQuotationsController);
router.get("/:id", authMiddleware, requireRole("owner", "staff", "user"), getQuotationController);
router.patch("/:id", authMiddleware, requireRole("owner", "staff"), updateQuotationController);
router.delete("/:id", authMiddleware, requireRole("owner", "staff"), deleteQuotationController);

// status change (accept / reject / cancel)
router.post("/:id/status", authMiddleware, requireRole("owner", "staff"), changeQuotationStatusController);

// convert to invoice
router.post("/:id/convert-to-invoice", authMiddleware, requireRole("owner", "staff"), convertQuotationToInvoiceController);

// preview/pdf/send endpoints are optional integrations (501 placeholders)
router.get("/:id/preview", authMiddleware, requireRole("owner", "staff", "user"), async (req, res) => {
    res.status(501).json({ success: false, message: "Preview endpoint - implement (PDF / render)" });
});
router.post("/:id/send", authMiddleware, requireRole("owner", "staff"), async (req, res) => {
    res.status(501).json({ success: false, message: "Send quotation by email - implement" });
});

export default router;