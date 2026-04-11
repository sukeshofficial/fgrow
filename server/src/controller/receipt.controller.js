import {
    createReceiptService,
    listReceiptsService,
    getReceiptByIdService,
    updateReceiptService,
    deleteReceiptService,
    applyToInvoicesService,
    autoApplyService,
    unapplyReceiptService,
    listUnpaidInvoicesForClient,
    sendReceiptService,
} from "../services/receipt.service.js";

import { generateReceiptPdfBuffer } from "../utils/pdf.helper.js"; // see helper below
import { getNextReceiptNumber, resetReceiptCounterService } from "../services/receipt.service.js";

export const getNextReceiptNumberController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const number = await getNextReceiptNumber(tenant_id);
        return res.json({ success: true, data: number });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const resetReceiptCounterController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const number = await resetReceiptCounterService(tenant_id, req.body.seq, req.body.yearStr);
        return res.json({ success: true, data: number });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const createReceiptController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const payload = req.body;
        const receipt = await createReceiptService({ tenant_id, user_id, payload });
        return res.status(201).json({ success: true, data: receipt });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const listReceiptsController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const { page = 1, limit = 20, search, ...filters } = req.query;
        const result = await listReceiptsService({ tenant_id, page: Number(page), limit: Number(limit), filters, search });
        return res.json({ success: true, data: result.items, pagination: result.pagination });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

/* Send receipt via email */
export const sendReceiptController = async (req, res) => {
    try {
        const user = req.user;
        const receipt_id = req.params.id;
        const body = req.body; // { to, cc, subject, message }
        const result = await sendReceiptService(user, receipt_id, body);
        return res.json({ success: true, data: result });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const getReceiptController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const receipt_id = req.params.id;
        const receipt = await getReceiptByIdService({ tenant_id, receipt_id });
        return res.json({ success: true, data: receipt });
    } catch (e) {
        return res.status(404).json({ success: false, message: e.message });
    }
};

export const updateReceiptController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const receipt_id = req.params.id;
        const payload = req.body;
        const updated = await updateReceiptService({ tenant_id, user_id, receipt_id, payload });
        return res.json({ success: true, data: updated });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const deleteReceiptController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const receipt_id = req.params.id;
        const force = req.query.force === "true";
        const result = await deleteReceiptService({ tenant_id, user_id, receipt_id, force });
        return res.json({ success: true, message: result.hard ? "Receipt permanently deleted" : "Receipt archived" });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

/* Apply allocations */
export const applyToInvoicesController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const receipt_id = req.params.id;
        const allocations = req.body.allocations || []; // [{ invoiceId, amount }]
        const receipt = await applyToInvoicesService({ tenant_id, user_id, receipt_id, allocations });
        return res.json({ success: true, data: receipt });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const autoApplyController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const receipt_id = req.params.id;
        const receipt = await autoApplyService({ tenant_id, user_id, receipt_id });
        return res.json({ success: true, data: receipt });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const unapplyReceiptController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const receipt_id = req.params.id;
        const invoiceIds = req.body.invoiceIds || [];
        const receipt = await unapplyReceiptService({ tenant_id, user_id, receipt_id, invoiceIds });
        return res.json({ success: true, data: receipt });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

/* unpaid invoices for client */
export const unpaidInvoicesForClientController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const clientId = req.params.clientId;
        const { page = 1, limit = 20, minAmount = 0 } = req.query;
        const result = await listUnpaidInvoicesForClient({ tenant_id, clientId, page: Number(page), limit: Number(limit), minAmount: Number(minAmount) });
        return res.json({ success: true, data: result.items, pagination: result.pagination });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

/* Print / preview receipt as PDF */
export const printReceiptController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const receipt_id = req.params.id;
        // re-use getReceiptByIdService to get populated receipt
        const receipt = await getReceiptByIdService({ tenant_id, receipt_id });
        const buffer = await generateReceiptPdfBuffer(receipt); // returns Buffer
        res.setHeader("Content-Type", "application/pdf");
        const filename = `receipt-${receipt.receipt_no || receipt._id}.pdf`;
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        return res.send(buffer);
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};