import mongoose from "mongoose";
import DocumentType from "../models/document/schemas/documentType.model.js";

const { Types } = mongoose;

export const createDocumentTypeService = async ({ tenant_id, user_id, payload }) => {
    if (!payload || !payload.name) throw new Error("name is required");

    // upsert check (prevent duplicate per tenant)
    const existing = await DocumentType.findOne({ tenant_id, name: payload.name.trim() });
    if (existing) throw new Error("Document type already exists");

    const doc = new DocumentType({
        tenant_id,
        name: payload.name.trim(),
        description: payload.description || "",
        created_by: user_id,
        updated_by: user_id
    });

    await doc.save();
    return doc.toObject();
};

export const listDocumentTypesService = async ({ tenant_id, include_inactive = false }) => {
    const q = { tenant_id };
    if (!include_inactive) q.is_active = true;
    const items = await DocumentType.find(q).sort({ name: 1 }).lean();
    return items;
};

export const getDocumentTypeByIdService = async ({ tenant_id, id }) => {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const doc = await DocumentType.findOne({ _id: id, tenant_id }).lean();
    if (!doc) throw new Error("Document type not found");
    return doc;
};

export const updateDocumentTypeService = async ({ tenant_id, user_id, id, payload }) => {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const doc = await DocumentType.findOne({ _id: id, tenant_id });
    if (!doc) throw new Error("Document type not found");

    if (payload.name && payload.name.trim() !== doc.name) {
        // uniqueness check
        const exists = await DocumentType.findOne({ tenant_id, name: payload.name.trim(), _id: { $ne: id } });
        if (exists) throw new Error("Another document type with that name already exists");
        doc.name = payload.name.trim();
    }

    if (payload.description !== undefined) doc.description = payload.description;
    if (payload.is_active !== undefined) doc.is_active = Boolean(payload.is_active);

    doc.updated_by = user_id;
    await doc.save();
    return doc.toObject();
};

export const deleteDocumentTypeService = async ({ tenant_id, id }) => {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const doc = await DocumentType.findOne({ _id: id, tenant_id });
    if (!doc) throw new Error("Document type not found");
    // soft delete
    doc.is_active = false;
    await doc.save();
    return true;
};