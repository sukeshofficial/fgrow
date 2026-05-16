import express from "express";
import {
    createBlogPost,
    updateBlogPost,
    getAdminBlogPosts,
    getAdminBlogPostById,
    deleteBlogPost,
    toggleFeatured,
    getBlogAnalytics
} from "../controllers/blog/adminBlog.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireSuperAdmin } from "../middleware/superAdmin.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

router.route("/")
    .get(getAdminBlogPosts)
    .post(createBlogPost);

router.get("/analytics", getBlogAnalytics);

router.route("/:id")
    .get(getAdminBlogPostById)
    .patch(updateBlogPost)
    .delete(deleteBlogPost);

router.patch("/:id/featured", toggleFeatured);

export default router;
