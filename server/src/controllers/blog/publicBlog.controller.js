import BlogPost from "../../models/blog/BlogPost.model.js";
import { Reaction } from "../../models/blog/Reaction.model.js";
import { User } from "../../models/auth/user.model.js";
import BlogView from "../../models/blog/BlogView.model.js";

// @desc    Get paginated blog posts (public listing)
// @route   GET /api/v0/blogs
// @access  Public
export const getPublicBlogs = async (req, res) => {
    try {
        const { page = 1, limit = 12, category, tags, q, sort, authorType, featured } = req.query;

        const query = { status: "published", visibility: "public" };

        if (category) query.category = category;
        if (authorType && authorType !== "all") query.authorType = authorType;
        if (featured === "true") query.isFeatured = true;
        if (tags) {
            const tagList = tags.split(",").map(t => t.trim());
            query.tags = { $in: tagList };
        }
        if (q) {
            query.$text = { $search: q };
        }

        const sortOrder = sort === "trending"
            ? { "stats.likes": -1, "stats.views": -1 }
            : { publishedAt: -1 };

        const total = await BlogPost.countDocuments(query);
        const posts = await BlogPost.find(query)
            .sort(sortOrder)
            .skip((page - 1) * Number(limit))
            .limit(parseInt(limit))
            .populate("authorId", "name profile_avatar role")
            .lean();

        const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

        // If user is authenticated, attach their reaction state and viewing state for each post
        let userReactions = {};
        let viewedPostIds = new Set();
        let userId = null;
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.auth_token;
        const token = (authHeader ? authHeader.replace("Bearer ", "") : cookieToken);

        if (token) {
            try {
                const { verifyToken } = await import("../../utils/jwt.js");
                const decoded = verifyToken(token);
                if (decoded?.userId || decoded?.id || decoded?._id) {
                    userId = decoded.userId || decoded.id || decoded._id;
                }
            } catch (_) { /* invalid token, treat as guest */ }
        }

        const postIds = posts.map(p => p._id);

        if (userId) {
            const [reactions, views] = await Promise.all([
                Reaction.find({ userId, targetId: { $in: postIds }, targetType: "BlogPost" }).lean(),
                BlogView.find({ userId, postId: { $in: postIds } }).select("postId").lean()
            ]);
            reactions.forEach(r => { userReactions[r.targetId.toString()] = r.type; });
            views.forEach(v => viewedPostIds.add(v.postId.toString()));
        } else {
            const views = await BlogView.find({ ip, userId: { $exists: false }, postId: { $in: postIds } }).select("postId").lean();
            views.forEach(v => viewedPostIds.add(v.postId.toString()));
        }

        const enrichedPosts = posts.map(p => ({
            ...p,
            userReaction: userReactions[p._id.toString()] || null,
            userHasViewed: viewedPostIds.has(p._id.toString())
        }));

        res.status(200).json({
            success: true,
            count: enrichedPosts.length,
            total,
            data: enrichedPosts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Fetch Public Blogs Error:", error);
        res.status(500).json({ success: false, message: "Error fetching blog posts" });
    }
};

// @desc    Get a single blog post by slug
// @route   GET /api/v0/blogs/:slug
// @access  Public
export const getBlogBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await BlogPost.findOne({ slug, status: "published" }).populate("authorId", "name profile_avatar");

        if (!post) {
            const draftPost = await BlogPost.findOne({ slug });
            if (draftPost) {
                return res.status(403).json({ success: false, message: "This post is currently a draft or under review." });
            }
            return res.status(404).json({ success: false, message: "Blog post not found" });
        }

        // 1. Identify User/Visitor
        let userId = null;
        let userReaction = null;
        let readingProgress = 0;
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.auth_token;
        const token = (authHeader ? authHeader.replace("Bearer ", "") : cookieToken);

        if (token) {
            try {
                const { verifyToken } = await import("../../utils/jwt.js");
                const decoded = verifyToken(token);
                if (decoded?.id || decoded?.userId) {
                    userId = decoded.id || decoded.userId;
                    const [reaction, user] = await Promise.all([
                        Reaction.findOne({ userId, targetId: post._id, targetType: "BlogPost" }).lean(),
                        User.findById(userId).select("readingProgress").lean()
                    ]);
                    if (reaction) userReaction = reaction.type;
                    if (user && user.readingProgress) {
                        readingProgress = user.readingProgress[post._id.toString()] || 0;
                    }
                }
            } catch (_) { /* invalid token, treat as guest */ }
        }

        const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

        // 2. Accurate View Tracking (Lifetime Unique per user/IP)
        const viewQuery = { postId: post._id };
        if (userId) {
            viewQuery.userId = userId;
        } else {
            viewQuery.ip = ip;
            viewQuery.userId = { $exists: false };
        }

        const recentView = await BlogView.findOne(viewQuery);
        let userHasViewed = !!recentView;

        if (!recentView) {
            await BlogView.create({ postId: post._id, userId, ip });
            await BlogPost.findByIdAndUpdate(post._id, { $inc: { "stats.views": 1 } });

            // Sync with User model if authenticated
            if (userId) {
                await User.findByIdAndUpdate(userId, { $addToSet: { viewedPosts: post._id } });
            }

            // Update local post object for response
            post.stats.views += 1;
            userHasViewed = true;
        }

        // Fetch related posts (same category, exclude current)
        const related = post.category
            ? await BlogPost.find({ status: "published", category: post.category, _id: { $ne: post._id } })
                .select("title slug coverImage readingTime stats publishedAt")
                .sort({ publishedAt: -1 })
                .limit(4)
                .lean()
            : [];

        res.status(200).json({
            success: true,
            data: { ...post.toObject(), userReaction, userHasViewed, readingProgress },
            related
        });
    } catch (error) {
        console.error("Fetch Blog Details Error:", error);
        res.status(500).json({ success: false, message: "Error fetching blog details" });
    }
};

// @desc    Update reading progress for a post
// @route   PATCH /api/v0/blogs/:id/progress
// @access  Private
export const updateReadingProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress } = req.body;
        const userId = req.user.id;

        if (progress === undefined) return res.status(400).json({ success: false, message: "Progress required" });

        // Use direct update for performance
        const update = {};
        update[`readingProgress.${id}`] = progress;

        await User.findByIdAndUpdate(userId, { $set: update });

        res.status(200).json({ success: true, message: "Progress updated" });
    } catch (error) {
        console.error("Update Reading Progress Error:", error);
        res.status(500).json({ success: false, message: "Error updating progress" });
    }
};
