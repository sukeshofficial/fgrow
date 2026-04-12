import express from "express";
import { subscribe, getSubscribers, triggerLaunchAnnouncement } from "../controller/launch.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireSuperAdmin } from "../middleware/superAdmin.middleware.js";

const router = express.Router();

// Public: subscribe to launch notifications
router.post("/subscribe", subscribe);

// Admin: view all subscribers
router.get("/subscribers", authMiddleware, requireSuperAdmin, getSubscribers);

// Admin: trigger manual launch announcement
router.post("/trigger", authMiddleware, requireSuperAdmin, triggerLaunchAnnouncement);


export default router;
