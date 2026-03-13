// controller/quotation.controller.js
import {
    createQuotationService,
    listQuotationsService,
    getQuotationByIdService,
    updateQuotationService,
    deleteQuotationService,
    changeQuotationStatusService,
    convertQuotationToInvoiceService
} from "../services/quotation.service.js";

export const createQuotationController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const payload = req.body;
        const q = await createQuotationService({ tenant_id, user_id, payload });
        return res.status(201).json({ success: true, data: q });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const listQuotationsController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const { page = 1, limit = 20, search, ...filters } = req.query;
        const result = await listQuotationsService({ tenant_id, page: Number(page), limit: Number(limit), filters, search });
        return res.json({ success: true, data: result.items, pagination: result.pagination });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const getQuotationController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const qid = req.params.id;
        const q = await getQuotationByIdService({ tenant_id, quotation_id: qid });
        return res.json({ success: true, data: q });
    } catch (e) {
        return res.status(404).json({ success: false, message: e.message });
    }
};

export const updateQuotationController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const qid = req.params.id;
        const payload = req.body;
        const updated = await updateQuotationService({ tenant_id, user_id, quotation_id: qid, payload });
        return res.json({ success: true, data: updated });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const deleteQuotationController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const qid = req.params.id;
        const force = req.query.force === "true";
        const result = await deleteQuotationService({ tenant_id, user_id, quotation_id: qid, force });
        return res.json({ success: true, message: result.hard ? "Quotation deleted" : "Quotation archived" });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const changeQuotationStatusController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const qid = req.params.id;
        const { status } = req.body; // expected: accepted|rejected|pending|cancelled
        const updated = await changeQuotationStatusService({ tenant_id, user_id, quotation_id: qid, newStatus: status });
        return res.json({ success: true, data: updated });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const convertQuotationToInvoiceController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const qid = req.params.id;
        const payload = req.body || {};
        const result = await convertQuotationToInvoiceService({ tenant_id, user_id, quotation_id: qid, payload });
        return res.json({ success: true, data: result });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};