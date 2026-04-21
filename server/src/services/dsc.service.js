import mongoose from "mongoose";
import DSC from "../models/dsc/dsc.model.js";

const { Types } = mongoose;

export const createDscService = async ({ tenant_id, user_id, payload }) => {

  if (!payload.client) throw new Error("Client required");
  if (!payload.class_type) throw new Error("Class required");
  if (!payload.issue_date) throw new Error("Issue date required");
  if (!payload.expiry_date) throw new Error("Expiry date required");

  const dsc = new DSC({
    tenant_id,
    client: payload.client,
    class_type: payload.class_type,
    password: payload.password || "",
    issue_date: new Date(payload.issue_date),
    expiry_date: new Date(payload.expiry_date),
    notes: payload.notes || "",
    created_by: user_id,
    updated_by: user_id
  });

  await dsc.save();

  return dsc.toObject();
};

export const listDscService = async ({
  tenant_id,
  page = 1,
  limit = 20,
  search,
  class_type
}) => {
  const skip = (page - 1) * limit;
  const pipeline = [
    { $match: { tenant_id: new Types.ObjectId(tenant_id), archived: false } }
  ];

  if (class_type && class_type !== "all") {
    pipeline.push({ $match: { class_type } });
  }

  // Join client
  pipeline.push(
    {
      $lookup: {
        from: "clients",
        localField: "client",
        foreignField: "_id",
        as: "client"
      }
    },
    { $unwind: "$client" }
  );

  // Search logic
  if (search) {
    const searchRegex = new RegExp(search, "i");
    pipeline.push({
      $match: {
        $or: [
          { "client.name": searchRegex },
          { password: searchRegex },
          { notes: searchRegex }
        ]
      }
    });
  }

  pipeline.push({ $sort: { issue_date: -1 } });

  const facetPipeline = [
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }]
      }
    }
  ];

  const [result] = await DSC.aggregate([...pipeline, ...facetPipeline]);
  const total = result.totalCount[0]?.count || 0;

  return {
    items: result.items,
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  };
};

export const getDscService = async ({ tenant_id, dsc_id }) => {

  if (!Types.ObjectId.isValid(dsc_id))
    throw new Error("Invalid DSC id");

  const dsc = await DSC.findOne({
    _id: dsc_id,
    tenant_id
  })
    .populate("client", "name")
    .lean();

  if (!dsc) throw new Error("DSC not found");

  return dsc;
};

export const updateDscService = async ({ tenant_id, user_id, dsc_id, payload }) => {

  const dsc = await DSC.findOne({
    _id: dsc_id,
    tenant_id
  });

  if (!dsc) throw new Error("DSC not found");

  if (payload.client !== undefined) dsc.client = payload.client;
  if (payload.class_type !== undefined) dsc.class_type = payload.class_type;
  if (payload.password !== undefined) dsc.password = payload.password;
  if (payload.issue_date !== undefined) dsc.issue_date = new Date(payload.issue_date);
  if (payload.expiry_date !== undefined) dsc.expiry_date = new Date(payload.expiry_date);
  if (payload.notes !== undefined) dsc.notes = payload.notes;

  dsc.updated_by = user_id;

  await dsc.save();

  return dsc.toObject();
};

export const deleteDscService = async ({ tenant_id, dsc_id }) => {

  const dsc = await DSC.findOne({
    _id: dsc_id,
    tenant_id
  });

  if (!dsc) throw new Error("DSC not found");

  dsc.archived = true;
  dsc.archived_at = new Date();

  await dsc.save();

  return true;
};