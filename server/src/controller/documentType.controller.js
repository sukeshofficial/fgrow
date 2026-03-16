import {
    createDocumentTypeService,
    listDocumentTypesService,
    getDocumentTypeByIdService,
    updateDocumentTypeService,
    deleteDocumentTypeService
} from "../services/documentType.service.js";

export const createDocumentTypeController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const payload = req.body;
        const created = await createDocumentTypeService({ tenant_id, user_id, payload });
        return res.status(201).json({ success: true, data: created });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const listDocumentTypesController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const include_inactive = req.query.include_inactive === "true";
        const items = await listDocumentTypesService({ tenant_id, include_inactive });
        return res.json({ success: true, data: items });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const getDocumentTypeController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const id = req.params.id;
        const item = await getDocumentTypeByIdService({ tenant_id, id });
        return res.json({ success: true, data: item });
    } catch (e) {
        return res.status(404).json({ success: false, message: e.message });
    }
};

export const updateDocumentTypeController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const id = req.params.id;
        const payload = req.body;
        const updated = await updateDocumentTypeService({ tenant_id, user_id, id, payload });
        return res.json({ success: true, data: updated });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const deleteDocumentTypeController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const id = req.params.id;
        await deleteDocumentTypeService({ tenant_id, id });
        return res.json({ success: true, message: "Document type deleted" });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};