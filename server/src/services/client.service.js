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
      if (filters[key] !== undefined) {
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
    if (filters.tags) {
      const tagArray = Array.isArray(filters.tags)
        ? filters.tags
        : [filters.tags];

      query.tags = {
        $in: tagArray
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
