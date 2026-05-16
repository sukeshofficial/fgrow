// server/src/routes/blog/social.routes.js
import express from "express";
import {
    getComments,
    postComment,
    editComment,
    deleteComment,
    toggleReaction,
    searchUsers
} from "../../controllers/blog/social.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import { spamProtection } from "../../middleware/spam.middleware.js";

const router = express.Router();

// Publicly viewable comments (auth optional for reaction state)
router.get("/:blogPostId/comments", getComments);

// Authenticated actions
router.use(authMiddleware);

router.post("/:blogPostId/comments", spamProtection, postComment);
router.patch("/comments/:id", editComment);
router.delete("/comments/:id", deleteComment);
router.post("/reactions/:targetId", spamProtection, toggleReaction);
router.get("/users/search", searchUsers);

export default router;
