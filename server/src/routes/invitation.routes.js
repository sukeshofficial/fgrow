import express from "express";
import {
  inviteUser,
  acceptInvitation,
} from "../controller/invitation.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/invite",
  authMiddleware,
  requireRole("owner", "admin"),
  inviteUser,
);

router.post("/accept", authMiddleware, acceptInvitation);

export default router;
