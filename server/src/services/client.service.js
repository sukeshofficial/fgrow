import mongoose from "mongoose";
import Client from "../models/client/client.model.js";

const { Types } = mongoose;

export const createClientService = async ({ tenant_id, user_id, payload }) => {
  try {
    const { pan } = payload;

    const existingClient = await Client.findOne({
      tenant_id,
      pan: pan?.toUpperCase(),
      archived: false,
    });

    if (existingClient) {
      throw new Error("Client with this PAN already exists");
    }

    if (payload.type == "Other" && !payload.customType) {
      throw new Error("Custom type is required for 'Other' client type");
    }

    const client = new Client({
      ...payload,
      tenant_id,
      created_by: user_id,
    });

    const savedClient = await client.save();

    return savedClient;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const listClientsService = async ({
  tenant_id,
  page = 1,
  limit = 10,
  search,
  filters = {},
}) => {
  try {
    const query = {
      tenant_id,
      archived: false,
    };

    // allowed filter fields
    const allowedFilters = [
      "type",
      "pan",
      "gstin",
      "group",
      "billing_profile",
      "is_active",
      "is_non_recurring",
      "file_no",
    ];

    // apply filters dynamically
    for (const key of allowedFilters) {
      if (filters[key] !== undefined && filters[key] !== "") {
        query[key] = filters[key];
      }
    }

    // group filter (ObjectId)
    if (filters.group) {
      if (!Types.ObjectId.isValid(filters.group)) {
        throw new Error("Invalid group id");
      }
      query.group = new Types.ObjectId(filters.group);
    }

    // billing profile filter
    if (
      filters.billing_profile &&
      Types.ObjectId.isValid(filters.billing_profile)
    ) {
      query.billing_profile = new Types.ObjectId(filters.billing_profile);
    }

    // tags filter
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      query.tags = {
        $in: filters.tags
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id)),
      };
    }

    // search logic
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { pan: { $regex: search, $options: "i" } },
        { gstin: { $regex: search, $options: "i" } },
        { primary_contact_name: { $regex: search, $options: "i" } },
        { primary_contact_mobile: { $regex: search, $options: "i" } },
        { primary_contact_email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const clients = await Client.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Client.countDocuments(query);

    return {
      clients,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getClientByIdService = async ({ tenant_id, client_id }) => {
  try {
    if (!Types.ObjectId.isValid(client_id)) {
      throw new Error("Invalid client id");
    }

    const client = await Client.findOne({
      _id: new Types.ObjectId(client_id),
      tenant_id,
      archived: false,
    })
      .populate("group", "name")
      .populate("tags", "name color")
      .populate("billing_profile", "name")
      .lean();

    if (!client) {
      throw new Error("Client not found");
    }

    return client;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateClientService = async ({ tenant_id, user_id, client_id, payload }) => {
  try {
    if (!Types.ObjectId.isValid(client_id)) {
      throw new Error("Invalid client id");
    }

    // validate type/customType relation
    if (payload.type === "Other" && !payload.customType) {
      throw new Error("Custom type is required for 'Other' client type");
    }

    // PAN uniqueness check (if pan provided)
    if (payload.pan) {
      const panUpper = payload.pan.toUpperCase();
      const existing = await Client.findOne({
        tenant_id,
        pan: panUpper,
        _id: { $ne: client_id },
        archived: false,
      });
      if (existing) {
        const err = new Error("Client with this PAN already exists");
        err.code = "DUP_PAN";
        throw err;
      }
      payload.pan = panUpper;
    }

    // validate/convert ObjectId-like fields if provided
    if (payload.group) {
      if (!Types.ObjectId.isValid(payload.group)) throw new Error("Invalid group id");
      payload.group = new Types.ObjectId(payload.group);
    }

    if (payload.billing_profile) {
      if (!Types.ObjectId.isValid(payload.billing_profile)) throw new Error("Invalid billing_profile id");
      payload.billing_profile = new Types.ObjectId(payload.billing_profile);
    }

    if (payload.tags) {
      const tags = Array.isArray(payload.tags) ? payload.tags : [payload.tags];
      payload.tags = tags.map((t) => {
        if (!Types.ObjectId.isValid(t)) throw new Error("Invalid tag id in tags");
        return new Types.ObjectId(t);
      });
    }

    // contacts safety: ensure max one primary
    if (payload.contacts && Array.isArray(payload.contacts)) {
      const primaries = payload.contacts.filter((c) => c.is_primary);
      if (primaries.length > 1) throw new Error("Only one primary contact allowed");
      // auto-fill primary_contact_* if provided in contacts
      const primaryContact = payload.contacts.find((c) => c.is_primary);
      if (primaryContact) {
        payload.primary_contact_name = primaryContact.name;
        payload.primary_contact_mobile = primaryContact.mobile;
        payload.primary_contact_email = primaryContact.email;
      }
    }

    // always set updated_by
    payload.updated_by = user_id;

    const updated = await Client.findOneAndUpdate(
      { _id: client_id, tenant_id, archived: false },
      { $set: payload },
      { new: true }
    ).populate("group", "name").populate("tags", "name color").lean();

    if (!updated) throw new Error("Client not found");

    return updated;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteClientService = async ({ tenant_id, user_id, client_id, force = false }) => {
  try {
    if (!Types.ObjectId.isValid(client_id)) {
      throw new Error("Invalid client id");
    }

    if (force) {
      // hard delete
      const deleted = await Client.findOneAndDelete({ _id: client_id, tenant_id });
      if (!deleted) throw new Error("Client not found");
      return { deleted, hard: true };
    } else {
      // soft delete (archive)
      const archived = await Client.findOneAndUpdate(
        { _id: client_id, tenant_id, archived: false },
        { $set: { archived: true, archived_at: new Date(), updated_by: user_id } },
        { new: true }
      ).lean();

      if (!archived) throw new Error("Client not found or already archived");
      return { archived, hard: false };
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * NEW: List all clients by tenant_id (Independent function)
 */
export const listClientsByTenantIdService = async ({ tenant_id, page = 1, limit = 10, search = "" }) => {
  try {
    const query = {
      tenant_id,
      archived: false
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { pan: { $regex: search, $options: "i" } },
        { file_no: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("group", "name")
      .populate("tags", "name color")
      .lean();

    const total = await Client.countDocuments(query);

    return {
      clients,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(error.message);
  }
};