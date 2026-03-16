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

export const listDscService = async ({ tenant_id }) => {

  return await DSC.find({
    tenant_id,
    archived: false
  })
    .populate("client", "name")
    .sort({ issue_date: -1 })
    .lean();
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