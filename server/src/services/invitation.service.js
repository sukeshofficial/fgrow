import { User } from "../models/user.model.js";
import { UserInvitation } from "../models/userInvitation.model.js";
import crypto from "crypto";

export const inviteUserService = async ({
  tenantId,
  userId,
  email,
  role,
  frontendUrl,
}) => {
  // 1️⃣ Check plan user limit
  const existingUsers = await User.countDocuments({
    tenant: tenantId,
    status: "active",
  });

  // Add subscription check logic here later

  // 2️⃣ Generate invite token
  const inviteToken = crypto.randomBytes(32).toString("hex");

  // 3️⃣ Create invitation
  await UserInvitation.create({
    tenant: tenantId,
    email,
    role,
    invited_by: userId,
    invite_token: inviteToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    message: "Invitation sent successfully",
    inviteLink: `${frontendUrl}/invite/${inviteToken}`,
  };
};

export const acceptInvitationService = async ({
  token,
  name,
  username,
  password,
}) => {
  const invitation = await UserInvitation.findOne({
    invite_token: token,
  });

  if (!invitation) {
    throw new Error("Invalid invitation");
  }

  if (invitation.expires_at < new Date()) {
    throw new Error("Invitation expired");
  }

  if (invitation.accepted_at) {
    throw new Error("Already accepted");
  }

  // Check if user exists
  let user = await User.findOne({ email: invitation.email });

  if (!user) {
    user = new User({
      name,
      username,
      email: invitation.email,
      tenant: invitation.tenant,
      role: invitation.role,
      status: "active",
    });

    user.password = password;
    await user.save();
  } else {
    user.tenant = invitation.tenant;
    user.role = invitation.role;
    user.status = "active";
    await user.save();
  }

  invitation.accepted_at = new Date();
  await invitation.save();

  return { message: "Joined successfully" };
};
