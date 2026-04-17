// services/collectionRequest.service.js
import mongoose from "mongoose";
import fs from "fs";
import CollectionRequest from "../models/documentCollectionRequest/documentCollectionRequest.model.js";
import Client from "../models/client/client.model.js";

import { uploadFileToCloud } from "../utils/cloudinary.js";

import { generateCollectionRequestNumber } from "../utils/generateDocumentCollectionRequestNumber.js";

const { Types } = mongoose;

/**
 * Create a collection request
 */
export const createCollectionRequestService = async ({
  tenant_id,
  user_id,
  payload,
}) => {
  if (!payload.client) throw new Error("client required");
  if (!payload.task) throw new Error("task required");
  if (!payload.message) throw new Error("message required");

  const request_no = await generateCollectionRequestNumber(tenant_id);

  const doc = new CollectionRequest({
    tenant_id,
    request_no,
    status: payload.status || "open",
    client: payload.client,
    task: payload.task,
    message: payload.message,
    documents_count: payload.documents_count || 0,
    created_by: user_id,
    updated_by: user_id,
  });

  await doc.save();

  return doc.toObject();
};

/**
 * List requests with pagination + filters + search
 */
export const listCollectionRequestsService = async ({
  tenant_id,
  page = 1,
  limit = 20,
  filters = {},
  search,
}) => {
  const query = { tenant_id: new Types.ObjectId(tenant_id), archived: false };

  if (filters.client && Types.ObjectId.isValid(filters.client))
    query.client = new Types.ObjectId(filters.client);
  if (filters.status) query.status = filters.status;
  if (filters.assigned_to && Types.ObjectId.isValid(filters.assigned_to))
    query.assigned_to = new Types.ObjectId(filters.assigned_to);
  if (filters.date_from || filters.date_to) {
    query.createdAt = {};
    if (filters.date_from) query.createdAt.$gte = new Date(filters.date_from);
    if (filters.date_to) {
      const to = new Date(filters.date_to);
      to.setHours(23, 59, 59, 999);
      query.createdAt.$lte = to;
    }
  }

  if (search) {
    const regex = { $regex: search, $options: "i" };
    query.$or = [{ task: regex }, { message: regex }, { request_no: regex }];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CollectionRequest.find(query)
      .populate("client", "name file_no")
      .populate("assigned_to", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CollectionRequest.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single
 */
export const getCollectionRequestService = async ({
  tenant_id,
  request_id,
}) => {
  if (!Types.ObjectId.isValid(request_id))
    throw new Error("Invalid request id");
  const r = await CollectionRequest.findOne({
    _id: request_id,
    tenant_id,
    archived: false,
  })
    .populate("client", "name file_no")
    .populate("assigned_to", "name email")
    .lean();
  if (!r) throw new Error("Collection request not found");
  return r;
};

/**
 * Update
 */
export const updateCollectionRequestService = async ({
  tenant_id,
  user_id,
  request_id,
  payload,
}) => {
  if (!Types.ObjectId.isValid(request_id))
    throw new Error("Invalid request id");

  const r = await CollectionRequest.findOne({ _id: request_id, tenant_id });
  if (!r) throw new Error("Collection request not found");

  const updatable = ["status", "task", "message", "due_date", "assigned_to", "documents_count"];
  updatable.forEach((k) => {
    if (payload[k] !== undefined) {
      if (
        k === "assigned_to" &&
        payload[k] &&
        !Types.ObjectId.isValid(payload[k])
      )
        throw new Error("Invalid assigned_to id");
      r[k] = payload[k];
    }
  });

  // if client is changed, validate
  if (payload.client !== undefined) {
    if (!Types.ObjectId.isValid(payload.client))
      throw new Error("Invalid client id");
    r.client = new Types.ObjectId(payload.client);
  }

  r.updated_by = user_id;
  await r.save();
  return r.toObject();
};

/**
 * Soft delete
 */
export const deleteCollectionRequestService = async ({
  tenant_id,
  request_id,
}) => {
  if (!Types.ObjectId.isValid(request_id))
    throw new Error("Invalid request id");
  const r = await CollectionRequest.findOne({ _id: request_id, tenant_id });
  if (!r) throw new Error("Collection request not found");
  r.archived = true;
  r.archived_at = new Date();
  await r.save();
  return true;
};

/**
 * Change status (open|in_progress|closed|cancelled)
 */
export const changeCollectionRequestStatusService = async ({
  tenant_id,
  user_id,
  request_id,
  newStatus,
}) => {
  if (!Types.ObjectId.isValid(request_id))
    throw new Error("Invalid request id");
  if (!["open", "in_progress", "closed", "cancelled"].includes(newStatus))
    throw new Error("Invalid status");
  const r = await CollectionRequest.findOne({ _id: request_id, tenant_id });
  if (!r) throw new Error("Collection request not found");
  r.status = newStatus;
  r.updated_by = user_id;
  await r.save();
  return r.toObject();
};

/**
 * Attach document(s) metadata to request (files already uploaded by middleware)
 * files: array of { key, url, name, size, mime }
 */
export const attachDocumentsToRequestService = async ({
  tenant_id,
  user_id,
  request_id,
  files = [],
}) => {
  if (!Types.ObjectId.isValid(request_id))
    throw new Error("Invalid request id");

  if (!Array.isArray(files) || files.length === 0)
    throw new Error("files required");

  const r = await CollectionRequest.findOne({ _id: request_id, tenant_id });

  if (!r) throw new Error("Collection request not found");

  const uploadedDocs = [];

  for (const file of files) {
    let upload;

    try {
      upload = await uploadFileToCloud(file.path, "collection_requests");
    } finally {
      // Remove temp file after upload attempt
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    if (!upload.success) {
      throw new Error(upload.error);
    }

    uploadedDocs.push({
      key: upload.public_id,
      url: upload.url,
      name: upload.name || file.originalname,
      size: upload.size || file.size,
      mime: upload.mime || file.mimetype,
      uploaded_by: user_id,
      uploaded_at: new Date(),
    });
  }

  r.documents = r.documents || [];
  r.documents.push(...uploadedDocs);

  r.updated_by = user_id;

  await r.save();

  return r.toObject();
};

/**
 * Remove a document by its key (cloudinary public_id) or subdocument _id
 */
export const removeDocumentFromRequestService = async ({
  tenant_id,
  user_id,
  request_id,
  file_identifier,
}) => {
  if (!Types.ObjectId.isValid(request_id))
    throw new Error("Invalid request id");

  const r = await CollectionRequest.findOne({
    _id: request_id,
    tenant_id,
  });

  if (!r) throw new Error("Collection request not found");

  // find document (by _id OR key)
  const doc = r.documents.find((d) => {
    return (
      (Types.ObjectId.isValid(file_identifier) &&
        String(d._id) === String(file_identifier)) ||
      String(d.key) === String(file_identifier)
    );
  });

  if (!doc) throw new Error("Document not found");

  // delete from cloudinary
  if (doc.key) {
    await cloudinary.uploader.destroy(doc.key, {
      resource_type: "raw",
    });
  }

  // remove from array
  r.documents = r.documents.filter((d) => String(d._id) !== String(doc._id));

  r.updated_by = user_id;

  await r.save();

  return r.toObject();
};
