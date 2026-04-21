import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireSuperAdmin } from "../middleware/superAdmin.middleware.js";
import {
    createReleaseNote,
    getAllReleaseNotes,
    getLatestReleaseNote,
    markAsSeen,
    deleteReleaseNote,
    toggleReleaseActive,
    resetAllUsersVersion,
    updateReleaseNote
} from "../controller/releaseNote.controller.js";

const router = express.Router();

const authSuperAdmin = [authMiddleware, requireSuperAdmin];

// User routes
router.get("/latest", authMiddleware, getLatestReleaseNote);
router.post("/mark-seen", authMiddleware, markAsSeen);

// Admin routes
router.post("/create", ...authSuperAdmin, createReleaseNote);
router.get("/all", ...authSuperAdmin, getAllReleaseNotes);
router.patch("/:id/toggle", ...authSuperAdmin, toggleReleaseActive);
router.patch("/:id", ...authSuperAdmin, updateReleaseNote);
router.delete("/:id", ...authSuperAdmin, deleteReleaseNote);
router.post("/reset-all", ...authSuperAdmin, resetAllUsersVersion);

export default router;
