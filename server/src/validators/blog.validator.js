// server/src/validators/blog.validator.js
import Joi from "joi";

export const createBlogSchema = Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    slug: Joi.string().trim().lowercase().min(3).max(200).pattern(/^[a-z0-9-]+$/).required()
        .messages({ "string.pattern.base": "Slug may only contain lowercase letters, numbers, and hyphens" }),
    summary: Joi.string().trim().max(500).allow("").optional(),
    content: Joi.string().min(10).required(),
    coverImage: Joi.string().uri().allow("").optional(),
    visibility: Joi.string().valid("public", "members-only").default("public"),
    status: Joi.string().valid("draft", "pending", "published", "archived").default("draft"),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10).default([]),
    category: Joi.string().trim().max(100).allow("").optional(),
    readingTime: Joi.number().integer().min(1).max(120).optional(),
});

export const updateBlogSchema = Joi.object({
    title: Joi.string().trim().min(3).max(200).optional(),
    slug: Joi.string().trim().lowercase().min(3).max(200).pattern(/^[a-z0-9-]+$/).optional(),
    summary: Joi.string().trim().max(500).allow("").optional(),
    content: Joi.string().min(10).optional(),
    coverImage: Joi.string().uri().allow("").optional(),
    visibility: Joi.string().valid("public", "members-only").optional(),
    status: Joi.string().valid("draft", "pending", "published", "archived").optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
    category: Joi.string().trim().max(100).allow("").optional(),
    readingTime: Joi.number().integer().min(1).max(120).optional(),
    isFeatured: Joi.boolean().optional(),
});

export const createCommentSchema = Joi.object({
    content: Joi.string().trim().min(1).max(1000).required(),
    parentId: Joi.string().hex().length(24).allow(null, "").optional(),
    mentions: Joi.array().items(Joi.string().hex().length(24)).max(10).default([]),
});

export const editCommentSchema = Joi.object({
    content: Joi.string().trim().min(1).max(1000).required(),
});

export const reactionSchema = Joi.object({
    targetType: Joi.string().valid("BlogPost", "Comment").required(),
    type: Joi.string().valid("like", "dislike").required(),
});
