import express from "express";
import { 
  inviteUser, 
  acceptInvitation,
  getPendingInvitations,
  revokeInvitation,
  getInvitationDetails
} from "../controller/invitation.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

const authManagement = [authMiddleware, requireRole("owner", "admin")];

router.post("/invite", ...authManagement, inviteUser);
router.get("/details/:token", authMiddleware, getInvitationDetails);
router.post("/accept", authMiddleware, acceptInvitation);

// Invitation Management
router.get("/pending", ...authManagement, getPendingInvitations);
router.delete("/:invitationId", ...authManagement, revokeInvitation);

export default router;