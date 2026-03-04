// controllers/client.controller.js
import * as clientService from "../services/client.service.js";
import { validatePAN, validateGSTIN, sanitizeClientObject } from "../utils/client.utils.js";

export async function createClient(req, res, next) {
    try {
        const tenant_id = req.user?.tenant_id;
        if (!tenant_id) return res.status(403).json({ message: "Tenant not found on user" });

        const payload = { ...req.body, tenant_id };

        // required fields
        if (!payload.name || !payload.pan) {
            return res.status(400).json({ message: "name and pan are required" });
        }

        // PAN validation
        if (!validatePAN(payload.pan)) {
            return res.status(400).json({ message: "Invalid PAN format" });
        }
        // GSTIN validation if provided
        if (payload.gstin && !validateGSTIN(payload.gstin)) {
            return res.status(400).json({ message: "Invalid GSTIN format" });
        }

        // Optional uniqueness check for file_no within tenant
        if (payload.file_no) {
            const exists = await clientService.existsFileNoForTenant(payload.file_no, tenant_id);
            if (exists) {
                return res.status(409).json({ message: "file_no must be unique within tenant" });
            }
        }

        payload.pan = payload.pan.toUpperCase();
        if (payload.gstin) payload.gstin = payload.gstin.toUpperCase();

        const created = await clientService.createClient({
            ...payload,
            created_by: req.user._id,
            updated_by: req.user._id
        });

        return res.status(201).json({ data: sanitizeClientObject(created) });
    } catch (err) {
        next(err);
    }
}

export async function listClients(req, res, next) {
    try {
        const tenant_id = req.user?.tenant_id;
        if (!tenant_id) return res.status(403).json({ message: "Tenant not found on user" });

        // Build filter from allowed query params
        const filters = { tenant_id };

        const { name, file_no, pan, gstin, type, tags, group } = req.query;
        if (name) filters.name = new RegExp(name, "i");
        if (file_no) filters.file_no = new RegExp(`^${file_no}`, "i");
        if (pan) filters.pan = pan.toUpperCase();
        if (gstin) filters.gstin = gstin.toUpperCase();
        if (type) filters.type = type;
        if (group) filters.group = group; // expect ObjectId string
        if (tags) {
            // accept tags as comma separated list of ids
            const t = Array.isArray(tags) ? tags : String(tags).split(",").map(s => s.trim()).filter(Boolean);
            if (t.length) filters.tags = { $in: t };
        }

        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 20,
            search: req.query.search || undefined,
            sort: req.query.sort || undefined
        };

        const result = await clientService.listClients(filters, options);
        // sanitize items
        result.items = result.items.map(sanitizeClientObject);
        return res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function getClient(req, res, next) {
    try {
        const tenant_id = req.user?.tenant_id;
        if (!tenant_id) return res.status(403).json({ message: "Tenant not found on user" });

        const client = await clientService.getClientById(req.params.id, tenant_id);
        if (!client) return res.status(404).json({ message: "Client not found" });

        return res.json({ data: sanitizeClientObject(client) });
    } catch (err) {
        next(err);
    }
}

export async function updateClient(req, res, next) {
    try {
        const tenant_id = req.user?.tenant_id;
        if (!tenant_id) return res.status(403).json({ message: "Tenant not found on user" });

        const update = { ...req.body, updated_by: req.user._id };

        if (update.pan && !validatePAN(update.pan)) {
            return res.status(400).json({ message: "Invalid PAN format" });
        }
        if (update.gstin && !validateGSTIN(update.gstin)) {
            return res.status(400).json({ message: "Invalid GSTIN format" });
        }

        // Optional uniqueness check for file_no within tenant (exclude current client)
        if (update.file_no) {
            const exists = await clientService.existsFileNoForTenant(update.file_no, tenant_id, req.params.id);
            if (exists) {
                return res.status(409).json({ message: "file_no must be unique within tenant" });
            }
        }

        if (update.pan) update.pan = update.pan.toUpperCase();
        if (update.gstin) update.gstin = update.gstin.toUpperCase();

        const updated = await clientService.updateClient(req.params.id, tenant_id, update);
        if (!updated) return res.status(404).json({ message: "Client not found or archived" });

        return res.json({ data: sanitizeClientObject(updated) });
    } catch (err) {
        next(err);
    }
}

export async function deleteClient(req, res, next) {
    try {
        const tenant_id = req.user?.tenant_id;
        if (!tenant_id) return res.status(403).json({ message: "Tenant not found on user" });

        const archived = await clientService.archiveClient(req.params.id, tenant_id, req.user._id);
        if (!archived) return res.status(404).json({ message: "Client not found or already archived" });

        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}