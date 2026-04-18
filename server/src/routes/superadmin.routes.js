import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireSuperAdmin } from "../middleware/superAdmin.middleware.js";
import {
  getAllUsersAdmin,
  deleteUserAdmin,
  forceLogoutUserAdmin
} from "../controller/superadmin.controller.js";

const router = express.Router();

const authSuperAdmin = [authMiddleware, requireSuperAdmin];

// Get grouped users
router.get("/users", ...authSuperAdmin, getAllUsersAdmin);

// Delete user
router.delete("/users/:userId", ...authSuperAdmin, deleteUserAdmin);

// Force logout user
router.patch("/users/:userId/logout", ...authSuperAdmin, forceLogoutUserAdmin);

export default router;
