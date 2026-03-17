import dotenv from "dotenv";

import {
  inviteUserService,
  acceptInvitationService,
  fetchPendingInvitationsService,
  revokeInvitationService,
} from "../services/invitation.service.js";

dotenv.config();

export const inviteUser = async (req, res) => {
  try {
    const { email, tenant_role } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await inviteUserService({
      tenant_id: req.user.tenant_id,
      userId: req.user.id,
      email,
      tenant_role,
      frontendUrl: process.env.FRONTEND_URL,
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await acceptInvitationService({
      token,
      userId: req.user.id,
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPendingInvitations = async (req, res) => {
  try {
    console.log("Fetching pending invites for tenant:", req.user.tenant_id);
    const invites = await fetchPendingInvitationsService(req.user.tenant_id);
    console.log("Found invites count:", invites.length);
    res.status(200).json({
      success: true,
      data: invites,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const revokeInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const result = await revokeInvitationService(invitationId, req.user.tenant_id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
