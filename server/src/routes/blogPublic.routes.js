import express from "express";
import { getPublicBlogs, getBlogBySlug, updateReadingProgress } from "../controllers/blog/publicBlog.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getPublicBlogs);
router.get("/:slug", getBlogBySlug);
router.patch("/:id/progress", authenticateUser, updateReadingProgress);

export default router;
