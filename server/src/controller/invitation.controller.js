import {
  inviteUserService,
  acceptInvitationService,
} from "../services/invitation.service.js";
import dotenv from "dotenv";

dotenv.config();

export const inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await inviteUserService({
      tenant_id: req.user.tenant_id,
      userId: req.user.id,
      email,
      role,
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
