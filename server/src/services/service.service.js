import mongoose from "mongoose";
import Service from "../models/service/service.model.js";
import ServiceClient from "../models/service/serviceClient.model.js";

const { Types } = mongoose;

export const createServiceService = async ({ tenant_id, user_id, payload }) => {

    if (!payload.name) throw new Error("Service name is required");

    const existing = await Service.findOne({ tenant_id, name: payload.name });

    // If active service already exists
    if (existing && !existing.archived) {
        throw new Error("Service with this name already exists");
    }

    // If archived service exists
    if (existing && existing.archived) {

        // Check if payload matches existing service
        const isSame =
            existing.description === payload.description &&
            existing.default_billing_rate === payload.default_billing_rate &&
            existing.gst_rate === payload.gst_rate;

        if (isSame) {
            // restore archived service
            existing.archived = false;
            existing.updated_by = user_id;

            await existing.save();

            return existing;
        }
    }

    // Otherwise create new service
    const doc = new Service({
        ...payload,
        tenant_id,
        created_by: user_id,
        updated_by: user_id,
    });

    return await doc.save();
};

export const listServicesService = async ({ tenant_id, page = 1, limit = 20, search, filters = {} }) => {
    const query = { tenant_id, archived: false };

    // Boolean filters
    if (filters.is_enabled !== undefined && filters.is_enabled !== 'all') {
        query.is_enabled = filters.is_enabled === 'true' || filters.is_enabled === true;
    }
    if (filters.is_recurring !== undefined && filters.is_recurring !== 'all') {
        query.is_recurring = filters.is_recurring === 'true' || filters.is_recurring === true;
    }

    // Number filters
    if (filters.gst_rate !== undefined && filters.gst_rate !== "") {
        query.gst_rate = Number(filters.gst_rate);
    }

    // Exact/Partial Match filters
    if (filters.sac_code) {
        query.sac_code = { $regex: filters.sac_code, $options: "i" };
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { sac_code: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
        Service.find(query)
            .select("name sac_code is_enabled is_recurring gst_rate default_billing_rate createdAt")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean(),
        Service.countDocuments(query)
    ]);

    return {
        services,
        pagination: { total, page, limit, total_pages: Math.ceil(total / limit) }
    };
};

export const getServiceByIdService = async ({ tenant_id, service_id }) => {
    if (!Types.ObjectId.isValid(service_id)) throw new Error("Invalid service id");

    const service = await Service.findOne({ _id: service_id, tenant_id, archived: false }).lean();
    if (!service) throw new Error("Service not found");

    return service;
};

export const updateServiceService = async ({ tenant_id, user_id, service_id, payload }) => {
    if (!Types.ObjectId.isValid(service_id)) throw new Error("Invalid service id");

    if (payload.name) {
        const other = await Service.findOne({ tenant_id, name: payload.name, _id: { $ne: service_id } });
        if (other) throw new Error("Service with this name already exists");
    }

    payload.updated_by = user_id;

    const updated = await Service.findOneAndUpdate(
        { _id: service_id, tenant_id },
        { $set: payload },
        { new: true }
    ).lean();

    if (!updated) throw new Error("Service not found");
    return updated;
};

export const deleteServiceService = async ({ tenant_id, service_id, force = false }) => {
    if (!Types.ObjectId.isValid(service_id)) throw new Error("Invalid service id");

    if (force) {
        const deleted = await Service.findOneAndDelete({ _id: service_id, tenant_id });
        if (!deleted) throw new Error("Service not found");
        // remove assignments too (cascade)
        await ServiceClient.deleteMany({ service: service_id, tenant_id });
        return { hard: true, deleted };
    } else {
        const archived = await Service.findOneAndUpdate(
            { _id: service_id, tenant_id, archived: false },
            { $set: { archived: true, updated_by: null, archived_at: new Date() } },
            { new: true }
        ).lean();
        if (!archived) throw new Error("Service not found or already archived");
        return { hard: false, archived };
    }
};

export const assignServiceToClientsService = async ({ tenant_id, service_id, user_id, clientEntries = [] }) => {
    if (!Types.ObjectId.isValid(service_id)) throw new Error("Invalid service id");

    // validate each client id and optional custom fields
    const ops = [];
    for (const entry of clientEntries) {
        const { client, custom_price = null, custom_users = [] } = entry;
        if (!Types.ObjectId.isValid(client)) throw new Error("Invalid client id in entries");

        ops.push({
            updateOne: {
                filter: { tenant_id, service: service_id, client },
                update: { $set: { tenant_id, service: service_id, client, custom_price, custom_users } },
                upsert: true
            }
        });
    }

    if (ops.length === 0) throw new Error("No clients to assign");

    await ServiceClient.bulkWrite(ops);

    // return assigned list
    const assigned = await ServiceClient.find({ service: service_id, tenant_id }).populate("client", "name file_no").lean();
    return assigned;
};

export const listAssignedClientsService = async ({ tenant_id, service_id }) => {
    if (!Types.ObjectId.isValid(service_id)) throw new Error("Invalid service id");
    return ServiceClient.find({ service: service_id, tenant_id }).populate("client", "name file_no").lean();
};

export const unassignClientService = async ({ tenant_id, service_id, client_id }) => {
    if (!Types.ObjectId.isValid(service_id) || !Types.ObjectId.isValid(client_id)) throw new Error("Invalid id");
    const res = await ServiceClient.findOneAndDelete({ tenant_id, service: service_id, client: client_id });
    if (!res) throw new Error("Assignment not found");
    return res;
};

export const listServicesByTenantService = async ({ tenant_id }) => {
    return await Service.find({ tenant_id, archived: false, is_enabled: true })
        .select("name description is_enabled is_recurring gst_rate default_billing_rate sac_code createdAt")
        .sort({ name: 1 })
        .lean();
};
