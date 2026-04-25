import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireSuperAdmin } from "../middleware/superAdmin.middleware.js";
import {
    createFeedback,
    getFeedbacks,
    updateFeedbackStatus,
} from "../controller/feedback.controller.js";

const router = express.Router();

// Submit feedback — any authenticated user
router.post("/", authMiddleware, createFeedback);

// List all feedbacks — Super Admin only
router.get("/admin", authMiddleware, requireSuperAdmin, getFeedbacks);

// Update feedback status — Super Admin only
router.patch("/admin/:id", authMiddleware, requireSuperAdmin, updateFeedbackStatus);

export default router;
