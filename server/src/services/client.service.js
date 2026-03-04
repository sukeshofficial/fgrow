// services/client.service.js
import Client from "../models/client.model.js";

/**
 * Create a new client
 * @param {Object} data - client payload (tenant_id should already be set)
 * @returns {Promise<Client>}
 */
export async function createClient(data) {
    const client = new Client(data);
    return client.save();
}

/**
 * Get paginated clients with filters
 * @param {Object} filters
 * @param {Object} options - { page, limit, sort, search }
 */
export async function listClients(filters = {}, options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const mongoFilter = { archived: false, ...filters };

    // text search handling if provided
    if (options.search) {
        // Use text index defined on client model: name and contacts.name
        mongoFilter.$text = { $search: options.search };
    }

    // Build query
    const query = Client.find(mongoFilter)
        .populate("group")
        .populate("tags")
        .skip(skip)
        .limit(limit);

    if (options.sort) {
        query.sort(options.sort);
    } else {
        query.sort({ createdAt: -1 });
    }

    const [items, total] = await Promise.all([
        query.exec(),
        Client.countDocuments(mongoFilter)
    ]);

    return {
        items,
        meta: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
}

/**
 * Get single client by id (and tenant guard)
 */
export async function getClientById(id, tenantId) {
    return Client.findOne({ _id: id, tenant_id: tenantId, archived: false })
        .populate("group")
        .populate("tags")
        .exec();
}

/**
 * Update client by id (tenant guarded)
 */
export async function updateClient(id, tenantId, update) {
    return Client.findOneAndUpdate(
        { _id: id, tenant_id: tenantId, archived: false },
        { $set: update },
        { new: true }
    ).populate("group").populate("tags").exec();
}

/**
 * Archive (soft-delete) a client
 */
export async function archiveClient(id, tenantId, archivedByUserId) {
    return Client.findOneAndUpdate(
        { _id: id, tenant_id: tenantId, archived: false },
        { $set: { archived: true, archived_at: new Date(), updated_by: archivedByUserId } },
        { new: true }
    ).exec();
}

/**
 * Optional: check uniqueness of file_no for tenant
 */
export async function existsFileNoForTenant(file_no, tenantId, excludeClientId = null) {
    if (!file_no) return false;
    const q = { tenant_id: tenantId, file_no: file_no.trim(), archived: false };
    if (excludeClientId) q._id = { $ne: excludeClientId };
    const c = await Client.countDocuments(q).lean();
    return c > 0;
}