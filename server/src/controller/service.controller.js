import {
    createServiceService,
    listServicesService,
    getServiceByIdService,
    updateServiceService,
    deleteServiceService,
    assignServiceToClientsService,
    listAssignedClientsService,
    unassignClientService
} from "../services/service.service.js";

export const createServiceController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const payload = req.body;

        const service = await createServiceService({ tenant_id, user_id, payload });
        return res.status(201).json({ success: true, data: service });
    } catch (e) {
        if (e.message.includes("already exists")) return res.status(409).json({ success: false, message: e.message });
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const listServicesController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const { page = 1, limit = 20, search, ...filters } = req.query;

        const result = await listServicesService({
            tenant_id,
            page: Number(page),
            limit: Number(limit),
            search,
            filters
        });

        return res.json({ success: true, data: result.services, pagination: result.pagination });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const getServiceByIdController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const service_id = req.params.id;

        const service = await getServiceByIdService({ tenant_id, service_id });
        return res.json({ success: true, data: service });
    } catch (e) {
        if (e.message.includes("Invalid service id") || e.message.includes("not found")) {
            return res.status(404).json({ success: false, message: e.message });
        }
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const updateServiceController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const service_id = req.params.id;
        const payload = req.body;

        const updated = await updateServiceService({ tenant_id, user_id, service_id, payload });
        return res.json({ success: true, data: updated });
    } catch (e) {
        if (e.message.includes("Invalid service id")) return res.status(400).json({ success: false, message: e.message });
        if (e.message.includes("already exists")) return res.status(409).json({ success: false, message: e.message });
        if (e.message.includes("not found")) return res.status(404).json({ success: false, message: e.message });
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteServiceController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const service_id = req.params.id;
        const force = req.query.force === "true";

        const result = await deleteServiceService({ tenant_id, service_id, force });
        if (result.hard) return res.json({ success: true, message: "Service permanently deleted" });
        return res.json({ success: true, message: "Service archived successfully", data: result.archived });
    } catch (e) {
        if (e.message.includes("Invalid service id")) return res.status(400).json({ success: false, message: e.message });
        if (e.message.includes("not found")) return res.status(404).json({ success: false, message: e.message });
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const assignServiceToClientsController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const user_id = req.user._id;
        const service_id = req.params.id;
        const clientEntries = req.body.clients; // [{ client, custom_price, custom_users: [] }, ...]

        const assigned = await assignServiceToClientsService({ tenant_id, service_id, user_id, clientEntries });
        return res.status(200).json({ success: true, data: assigned });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const listAssignedClientsController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const service_id = req.params.id;
        const list = await listAssignedClientsService({ tenant_id, service_id });
        return res.json({ success: true, data: list });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};

export const unassignClientController = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const service_id = req.params.id;
        const client_id = req.params.clientId;

        const removed = await unassignClientService({ tenant_id, service_id, client_id });
        return res.json({ success: true, data: removed });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
};
