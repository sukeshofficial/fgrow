// server/src/models/blog/BlogView.model.js
import mongoose from "mongoose";

const blogViewSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BlogPost",
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    ip: {
        type: String,
        required: true
    },
    viewedAt: {
        type: Date,
        default: Date.now,
        expires: 86400 * 30 // Keep view logs for 30 days
    }
}, { timestamps: true });

// Create a compound index for fast lookup of recent views by the same user/IP
blogViewSchema.index({ postId: 1, userId: 1, ip: 1, createdAt: -1 });

const BlogView = mongoose.model("BlogView", blogViewSchema);
export default BlogView;
