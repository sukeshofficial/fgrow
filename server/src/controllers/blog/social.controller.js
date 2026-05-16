// server/src/controllers/blog/social.controller.js
import { Comment } from "../../models/blog/Comment.model.js";
import { Reaction } from "../../models/blog/Reaction.model.js";
import BlogPost from "../../models/blog/BlogPost.model.js";
import { User } from "../../models/auth/user.model.js";
import { createCommentSchema, editCommentSchema, reactionSchema } from "../../validators/blog.validator.js";

// @desc    Get comments for a blog post (nested, max 2 levels)
export const getComments = async (req, res) => {
    try {
        const { blogPostId } = req.params;
        const { sort = "newest" } = req.query;

        // Current user (optional — for reaction states)
        let currentUserId = null;
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.auth_token;
        const token = (authHeader ? authHeader.replace("Bearer ", "") : cookieToken);

        if (token) {
            try {
                const { verifyToken } = await import("../../utils/jwt.js");
                const decoded = verifyToken(token);
                if (decoded?.userId || decoded?.id || decoded?._id) {
                    currentUserId = decoded.userId || decoded.id || decoded._id;
                }
            } catch (_) { /* no auth */ }
        }

        let sortQuery = { createdAt: -1 };
        if (sort === "oldest") sortQuery = { createdAt: 1 };
        if (sort === "popular") sortQuery = { "stats.likes": -1, createdAt: -1 };

        const comments = await Comment.find({ blogPostId, parentId: null })
            .populate("authorId", "name profile_avatar")
            .populate("mentions", "name profile_avatar")
            .sort(sortQuery);

        // Fetch user's reactions to all comments if authenticated
        let userReactionMap = {};
        if (currentUserId) {
            const allCommentIds = comments.map(c => c._id);
            // Also need reply IDs — gather all in a second pass after reply fetch
            const reactions = await Reaction.find({
                userId: currentUserId,
                targetType: "Comment",
                targetId: { $in: allCommentIds }
            }).lean();
            reactions.forEach(r => { userReactionMap[r.targetId.toString()] = r.type; });
        }

        const buildComment = (c) => ({
            ...c.toObject(),
            userHasLiked: userReactionMap[c._id.toString()] === "like",
            userHasDisliked: userReactionMap[c._id.toString()] === "dislike",
            isOwner: currentUserId ? c.authorId?._id?.toString() === currentUserId.toString() : false,
        });

        const commentsWithReplies = await Promise.all(comments.map(async (c) => {
            const replies = await Comment.find({ parentId: c._id })
                .populate("authorId", "name profile_avatar")
                .populate("mentions", "name profile_avatar")
                .sort({ createdAt: 1 });

            // Collect reply IDs for reaction lookup
            if (currentUserId) {
                const replyIds = replies.map(r => r._id);
                const replyReactions = await Reaction.find({
                    userId: currentUserId,
                    targetType: "Comment",
                    targetId: { $in: replyIds }
                }).lean();
                replyReactions.forEach(r => { userReactionMap[r.targetId.toString()] = r.type; });
            }

            const repliesWithDeepReplies = await Promise.all(replies.map(async (r) => {
                const deepReplies = await Comment.find({ parentId: r._id })
                    .populate("authorId", "name profile_avatar")
                    .populate("mentions", "name profile_avatar")
                    .sort({ createdAt: 1 });

                // Collect deep reply IDs for reaction lookup
                if (currentUserId) {
                    const deepIds = deepReplies.map(d => d._id);
                    const deepReactions = await Reaction.find({
                        userId: currentUserId,
                        targetType: "Comment",
                        targetId: { $in: deepIds }
                    }).lean();
                    deepReactions.forEach(rx => { userReactionMap[rx.targetId.toString()] = rx.type; });
                }

                return { ...buildComment(r), replies: deepReplies.map(d => buildComment(d)) };
            }));

            return { ...buildComment(c), replies: repliesWithDeepReplies };
        }));

        res.status(200).json({ success: true, data: commentsWithReplies });
    } catch (error) {
        console.error("Fetch Comments Error:", error);
        res.status(500).json({ success: false, message: "Error fetching comments" });
    }
};

// @desc    Post a comment or reply
export const postComment = async (req, res) => {
    try {
        const { blogPostId } = req.params;
        const authorId = req.user.id;

        const { error, value } = createCommentSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(", ") });
        }

        const { content, parentId, mentions } = value;

        const comment = await Comment.create({ blogPostId, authorId, content, parentId: parentId || null, mentions });

        await BlogPost.findByIdAndUpdate(blogPostId, { $inc: { "stats.comments": 1 } });
        if (parentId) {
            await Comment.findByIdAndUpdate(parentId, { $inc: { "stats.replies": 1 } });
        }

        const populated = await comment.populate("authorId", "name profile_avatar");
        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        console.error("Post Comment Error:", error);
        res.status(400).json({ success: false, message: error.message || "Error posting comment" });
    }
};

// @desc    Edit own comment
// @route   PATCH /api/v0/blog-social/comments/:id
export const editComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { error, value } = editCommentSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(", ") });
        }

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });
        if (comment.authorId.toString() !== userId) {
            return res.status(403).json({ success: false, message: "You can only edit your own comments" });
        }
        if (comment.isDeleted || comment.isModerated) {
            return res.status(400).json({ success: false, message: "Cannot edit a deleted or moderated comment" });
        }

        comment.content = value.content;
        comment.isEdited = true;
        comment.editedAt = new Date();
        await comment.save();

        const populated = await comment.populate("authorId", "name profile_avatar");
        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        console.error("Edit Comment Error:", error);
        res.status(500).json({ success: false, message: "Error editing comment" });
    }
};

// @desc    Soft delete own comment
// @route   DELETE /api/v0/blog-social/comments/:id
export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.platform_role === "super_admin" || req.user.role === "superadmin";

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });
        if (comment.authorId.toString() !== userId && !isAdmin) {
            return res.status(403).json({ success: false, message: "You can only delete your own comments" });
        }

        const hasReplies = await Comment.exists({ parentId: id });

        if (hasReplies) {
            // Soft delete to preserve thread structure
            comment.isDeleted = true;
            comment.content = "[deleted]";
            comment.mentions = [];
            if (comment.stats) comment.stats.likes = 0;
            await comment.save();
        } else {
            // Hard delete leaf node
            await comment.deleteOne();

            // Adjust parent reply count if applicable
            if (comment.parentId) {
                await Comment.findByIdAndUpdate(comment.parentId, { $inc: { "stats.replies": -1 } });
            }
        }

        // Clean up all Reactions targeting this comment
        await Reaction.deleteMany({ targetId: id, targetType: "Comment" });

        // Remove from all Users' liked/disliked arrays
        await User.updateMany(
            {},
            { $pull: { likedComments: id, dislikedComments: id } }
        );

        // Decrement comment count on post
        await BlogPost.findByIdAndUpdate(comment.blogPostId, { $inc: { "stats.comments": -1 } });

        res.status(200).json({ success: true, message: "Comment deleted" });
    } catch (error) {
        console.error("Delete Comment Error:", error);
        res.status(500).json({ success: false, message: "Error deleting comment" });
    }
};

// @desc    Toggle reaction (like/dislike) with validation & user sync
export const toggleReaction = async (req, res) => {
    try {
        const { targetId } = req.params;
        const userId = req.user.id;

        const { error, value } = reactionSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(", ") });
        }
        const { targetType, type } = value;

        const existing = await Reaction.findOne({ userId, targetId });

        if (existing) {
            if (existing.type === type) {
                // Toggle off
                await existing.deleteOne();
                await syncUserReaction(userId, targetId, targetType, type, null);
                return res.status(200).json({ success: true, message: "Reaction removed", action: "removed", userReaction: null });
            } else {
                // Switch reaction
                const oldType = existing.type;
                existing.type = type;
                await existing.save();
                await syncUserReaction(userId, targetId, targetType, oldType, type);
                return res.status(200).json({ success: true, message: "Reaction updated", action: "updated", userReaction: type });
            }
        }

        // New reaction
        await Reaction.create({ userId, targetId, targetType, type });
        await syncUserReaction(userId, targetId, targetType, null, type);

        res.status(201).json({ success: true, message: "Reaction added", action: "added", userReaction: type });
    } catch (error) {
        console.error("Toggle Reaction Error:", error);
        res.status(500).json({ success: false, message: "Error processing reaction" });
    }
};

/**
 * Syncs reaction state with target stats and User engagement arrays
 */
async function syncUserReaction(userId, targetId, targetType, oldType, newType) {
    const Model = targetType === "BlogPost" ? BlogPost : Comment;
    const userUpdate = { $pull: {}, $addToSet: {} };
    const statUpdate = { $inc: {} };

    // 1. Remove old transition
    if (oldType) {
        const field = `${oldType}d${targetType === "BlogPost" ? "Posts" : "Comments"}`;
        userUpdate.$pull[field] = targetId;
        if (oldType === "like") statUpdate.$inc["stats.likes"] = -1;
    }

    // 2. Add new transition
    if (newType) {
        const field = `${newType}d${targetType === "BlogPost" ? "Posts" : "Comments"}`;
        userUpdate.$addToSet[field] = targetId;
        if (newType === "like") statUpdate.$inc["stats.likes"] = 1;
    }

    // Apply updates
    await Promise.all([
        User.findByIdAndUpdate(userId, userUpdate),
        Object.keys(statUpdate.$inc).length > 0 ? Model.findByIdAndUpdate(targetId, statUpdate) : Promise.resolve()
    ]);
}

// @desc    Search users for @mentions
export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.status(400).json({ success: false, message: "Query too short" });

        const users = await User.find({
            $or: [
                { name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } }
            ]
        }).select("name profile_avatar email").limit(10);

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("User Search Error:", error);
        res.status(500).json({ success: false, message: "Error searching users" });
    }
};
