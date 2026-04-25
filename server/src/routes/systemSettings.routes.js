import express from "express";
import {
    getAllSettings,
    getPublicSettings,
    updateSettings,
} from "../controller/systemSettings.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireSuperAdmin } from "../middleware/superAdmin.middleware.js";

const router = express.Router();

/**
 * Public settings route (needs to be available for all users, or even unauthenticated if needed)
 * Actually, we only really need authenticated users to fetch logout logic securely, but public is fine.
 */
router.get("/public", getPublicSettings);

/**
 * Super Admin Routes
 */
router.use(authMiddleware, requireSuperAdmin);

router.get("/", getAllSettings);
router.patch("/", updateSettings);

export default router;
