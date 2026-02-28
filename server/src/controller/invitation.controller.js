import {
  inviteUserService,
  acceptInvitationService,
} from "../services/invitation.service.js";

export const inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;

    const result = await inviteUserService({
      tenantId: req.tenantId,
      userId: req.userId,
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
    const { token, name, username, password } = req.body;

    const result = await acceptInvitationService({
      token,
      name,
      username,
      password,
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
