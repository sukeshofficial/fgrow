import express from "express";
import {
  inviteUser,
  acceptInvitation,
} from "../controller/invitation.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

router.post(
  "/invite",
  authMiddleware,
  requireRole("owner"),
  inviteUser,
);

router.post("/accept", authMiddleware, acceptInvitation);

export default router;
