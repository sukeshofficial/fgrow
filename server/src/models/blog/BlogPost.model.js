import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
        summary: {
            type: String,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
            trim: true,
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        authorType: {
            type: String,
            enum: ["admin", "user"],
            required: true,
        },
        visibility: {
            type: String,
            enum: ["public", "members-only"],
            default: "public",
        },
        status: {
            type: String,
            enum: ["draft", "pending", "published", "archived"],
            default: "draft",
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        category: {
            type: String,
            trim: true,
        },
        readingTime: {
            type: Number,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        stats: {
            views: { type: Number, default: 0 },
            likes: { type: Number, default: 0 },
            comments: { type: Number, default: 0 },
        },
        publishedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Text indexes for full-text search
blogPostSchema.index({
    title: "text",
    summary: "text",
    content: "text",
    tags: "text",
});

export default mongoose.model("BlogPost", blogPostSchema);
