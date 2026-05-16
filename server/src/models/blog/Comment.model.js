// server/src/models/blog/Comment.model.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        blogPostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BlogPost",
            required: true,
            index: true,
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
            index: true,
        },
        depth: {
            type: Number,
            default: 0,
        },
        mentions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        stats: {
            likes: { type: Number, default: 0 },
            replies: { type: Number, default: 0 },
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        isModerated: {
            type: Boolean,
            default: false,
        },
        moderationReason: String,
        editedAt: Date,
    },
    { timestamps: true }
);

// Prevent too deep nesting (user requirement: max depth 2)
commentSchema.pre("save", async function () {
    if (this.parentId && this.isNew) {
        const parent = await mongoose.model("Comment").findById(this.parentId);
        if (parent) {
            this.depth = parent.depth + 1;
            if (this.depth > 2) {
                throw new Error("Maximum comment depth reached.");
            }
        }
    }
});

export const Comment = mongoose.model("Comment", commentSchema);
