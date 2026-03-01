import { User } from "../models/user.model.js";
import Tenant from "../models/tenant.model.js";
import { UserInvitation } from "../models/userInvitation.model.js";
import crypto from "crypto";

export const inviteUserService = async ({
  tenant_id,
  userId,
  email,
  role,
  frontendUrl,
}) => {
  // 1️⃣ Check tenant verification status
  const tenant = await Tenant.findById(tenant_id);

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  if (tenant.verificationStatus !== "verified") {
    throw new Error(
      "Your organization is not verified. You cannot add staff or clients until verification is complete.",
    );
  }

  if (!tenant.isActive) {
    throw new Error("Tenant is inactive");
  }

  // 2️⃣ Generate invite token
  const inviteToken = crypto.randomBytes(32).toString("hex");

  // 3️⃣ Create invitation
  const userInvitation = await UserInvitation.create({
    tenant_id: tenant_id,
    email,
    role,
    invited_by: userId,
    invite_token: inviteToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    message: "Invitation sent successfully",
    inviteLink: `${frontendUrl}/invite/${inviteToken}`,
    invitation: userInvitation,
  };
};

export const acceptInvitationService = async ({ token, userId }) => {
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

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.email !== invitation.email) {
    throw new Error("This invitation is not for this account");
  }

  user.tenant_id = invitation.tenant_id;
  user.role = invitation.role;
  user.status = "active";

  await user.save();

  invitation.accepted_at = new Date();
  await invitation.save();

  return {
    message: "Joined successfully",
    user: user.toJSON(),
  };
};
