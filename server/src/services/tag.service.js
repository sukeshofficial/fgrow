import mongoose from "mongoose";
import Tag from "../models/tag/tag.model.js";

const { Types } = mongoose;

/* CREATE */
export const createTagService = async ({ tenant_id, payload }) => {
    const existing = await Tag.findOne({
        tenant_id,
        name: payload.name,
    });

    if (existing) {
        throw new Error("Tag already exists");
    }

    const tag = new Tag({
        ...payload,
        tenant_id,
    });

    return await tag.save();
};

/* LIST */
export const listTagsService = async ({ tenant_id }) => {
    const tags = await Tag.find({ tenant_id })
        .sort({ createdAt: -1 })
        .lean();

    return tags;
};

/* GET ONE */
export const getTagService = async ({ tenant_id, tag_id }) => {
    if (!Types.ObjectId.isValid(tag_id)) {
        throw new Error("Invalid tag id");
    }

    const tag = await Tag.findOne({
        _id: tag_id,
        tenant_id,
    }).lean();

    if (!tag) {
        throw new Error("Tag not found");
    }

    return tag;
};

/* UPDATE */
export const updateTagService = async ({ tenant_id, tag_id, payload }) => {
    if (!Types.ObjectId.isValid(tag_id)) {
        throw new Error("Invalid tag id");
    }

    const tag = await Tag.findOneAndUpdate(
        {
            _id: tag_id,
            tenant_id,
        },
        payload,
        { new: true }
    );

    if (!tag) {
        throw new Error("Tag not found");
    }

    return tag;
};

/* DELETE */
export const deleteTagService = async ({ tenant_id, tag_id }) => {
    if (!Types.ObjectId.isValid(tag_id)) {
        throw new Error("Invalid tag id");
    }

    const tag = await Tag.findOneAndDelete({
        _id: tag_id,
        tenant_id,
    });

    if (!tag) {
        throw new Error("Tag not found");
    }

    return tag;
};