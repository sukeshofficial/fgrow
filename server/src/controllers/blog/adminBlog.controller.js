import mongoose from "mongoose";
import BlogPost from "../../models/blog/BlogPost.model.js";
import { createBlogSchema, updateBlogSchema } from "../../validators/blog.validator.js";

// @desc    Create a new official blog post
// @route   POST /api/v0/admin/blogs
// @access  SuperAdmin
export const createBlogPost = async (req, res) => {
    try {
        const { error, value } = createBlogSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(", ") });
        }

        const existingSlug = await BlogPost.findOne({ slug: value.slug });
        if (existingSlug) {
            return res.status(400).json({ success: false, message: "Slug must be unique. Try a different title." });
        }

        const newPost = new BlogPost({
            ...value,
            authorId: req.user.id,
            authorType: "admin",
            status: value.status || "draft",
        });

        await newPost.save();
        res.status(201).json({ success: true, data: newPost });
    } catch (error) {
        console.error("Create Blog Error:", error);
        res.status(500).json({ success: false, message: "Error creating blog post" });
    }
};

// @desc    Update an official blog post
// @route   PATCH /api/v0/admin/blogs/:id
// @access  SuperAdmin
export const updateBlogPost = async (req, res) => {
    try {
        const { id } = req.params;

        const { error, value } = updateBlogSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(", ") });
        }

        const post = await BlogPost.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Blog post not found" });
        }

        // If changing slug, check uniqueness
        if (value.slug && value.slug !== post.slug) {
            const existingSlug = await BlogPost.findOne({ slug: value.slug });
            if (existingSlug) {
                return res.status(400).json({ success: false, message: "Slug must be unique" });
            }
        }

        // Set publishedAt when first published
        if (value.status === "published" && post.status !== "published" && !post.publishedAt) {
            post.publishedAt = new Date();
        }

        Object.assign(post, value);
        await post.save();

        res.status(200).json({ success: true, data: post });
    } catch (error) {
        console.error("Update Blog Error:", error);
        res.status(500).json({ success: false, message: "Error updating blog post" });
    }
};

// @desc    Get all blog posts for admin (with filters)
// @route   GET /api/v0/admin/blogs
// @access  SuperAdmin
export const getAdminBlogPosts = async (req, res) => {
    try {
        const { status, q, page = 1, limit = 20 } = req.query;
        const query = { authorType: "admin" };

        if (status && status !== "all") {
            query.status = status;
        }
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: "i" } },
                { slug: { $regex: q, $options: "i" } },
                { category: { $regex: q, $options: "i" } },
            ];
        }

        const total = await BlogPost.countDocuments(query);
        const posts = await BlogPost.find(query)
            .populate("authorId", "name profile_avatar")
            .sort({ createdAt: -1 })
            .skip((page - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        // Status counts for tabs
        const counts = await BlogPost.aggregate([
            { $match: { authorType: "admin" } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const statusCounts = { all: total };
        counts.forEach(c => { statusCounts[c._id] = c.count; });

        res.status(200).json({ success: true, count: posts.length, total, data: posts, statusCounts });
    } catch (error) {
        console.error("Fetch Admin Blogs Error:", error);
        res.status(500).json({ success: false, message: "Error fetching blog posts" });
    }
};

// @desc    Get a single blog post by ID (for editor)
// @route   GET /api/v0/admin/blogs/:id
// @access  SuperAdmin
export const getAdminBlogPostById = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id).populate("authorId", "name avatar");
        if (!post) {
            return res.status(404).json({ success: false, message: "Blog post not found" });
        }
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        console.error("Fetch Admin Blog By ID Error:", error);
        res.status(500).json({ success: false, message: "Error fetching blog post" });
    }
};

// @desc    Toggle featured status of a blog post
// @route   PATCH /api/v0/admin/blogs/:id/featured
// @access  SuperAdmin
export const toggleFeatured = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Blog post not found" });
        }
        post.isFeatured = !post.isFeatured;
        await post.save();
        res.status(200).json({ success: true, data: { isFeatured: post.isFeatured }, message: `Post ${post.isFeatured ? "featured" : "unfeatured"}` });
    } catch (error) {
        console.error("Toggle Featured Error:", error);
        res.status(500).json({ success: false, message: "Error toggling featured status" });
    }
};

// @desc    Delete/archive an official blog post
// @route   DELETE /api/v0/admin/blogs/:id
// @access  SuperAdmin
export const deleteBlogPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await BlogPost.findByIdAndDelete(id);
        if (!post) {
            return res.status(404).json({ success: false, message: "Blog post not found" });
        }
        res.status(200).json({ success: true, message: "Blog post deleted" });
    } catch (error) {
        console.error("Delete Blog Error:", error);
        res.status(500).json({ success: false, message: "Error deleting blog post" });
    }
};

/**
 * @desc    Get aggregated blog analytics for admin dashboard
 * @route   GET /api/v0/admin/blogs/analytics
 */
export const getBlogAnalytics = async (req, res) => {
    try {
        const stats = await BlogPost.aggregate([
            { $match: { authorType: "admin" } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$stats.views" },
                    totalLikes: { $sum: "$stats.likes" },
                    totalComments: { $sum: "$stats.comments" },
                    avgReadTime: { $avg: "$readingTime" }
                }
            }
        ]);

        const topPost = await BlogPost.findOne({ authorType: "admin" })
            .sort({ "stats.views": -1 })
            .select("title stats.views slug")
            .lean();

        const categoryStats = await BlogPost.aggregate([
            { $match: { authorType: "admin" } },
            { $group: { _id: "$category", count: { $sum: 1 }, views: { $sum: "$stats.views" } } },
            { $sort: { views: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                overall: stats[0] || { totalViews: 0, totalLikes: 0, totalComments: 0, avgReadTime: 0 },
                topPost,
                categories: categoryStats
            }
        });
    } catch (error) {
        console.error("Fetch Analytics Error:", error);
        res.status(500).json({ success: false, message: "Error fetching analytics" });
    }
};
