import crypto from "crypto";

import Tenant from "../models/tenant/tenant.model.js";
import sendEmail from "../utils/sendEmail.js";

import { User } from "../models/auth/user.model.js";
import { UserInvitation } from "../models/auth/userInvitation.model.js";

export const inviteUserService = async ({
  tenant_id,
  userId,
  email,
  tenant_role,
  frontendUrl,
}) => {
  // 1️⃣ Check tenant verification status
  console.log("Inviting user to tenant:", tenant_id, "email:", email);
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

  // 1b Check if the inviter is the owner
  const inviter = await User.findById(userId);
  if (!inviter || inviter.tenant_role !== "owner") {
    throw new Error("Only organization owners can invite new members.");
  }

  // 1c Check if the invited role is staff
  if (tenant_role !== "staff") {
    throw new Error("Only staff members can be invited.");
  }

  // 2️⃣ Generate invite token
  const inviteToken = crypto.randomBytes(32).toString("hex");

  // 3️⃣ Create invitation

  // Check if there's already a pending invitation for the same email
  const existingInvitation = await UserInvitation.findOne({
    tenant_id,
    email,
    accepted_at: null,
    expires_at: { $gt: new Date() }
  });

  if (existingInvitation) {
    throw new Error("An active invitation already exists for this user.");
  }

  const userInvitation = await UserInvitation.create({
    tenant_id: tenant_id,
    email,
    tenant_role,
    invited_by: userId,
    invite_token: inviteToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const user = await User.findOne({ email });

  if (user) {
    user.invited_by = userId;
    if (user.status !== "active") {
      user.status = "invited";
    }
    await user.save();
  }

  // 4️⃣ Send email (placeholder - implement actual email sending logic here)
  await sendEmail({
    to: email,
    subject: "You're invited to join FGrow",
    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #2c3e50;">You're invited to join FGrow 🎉</h2>
      
      <p>Hello,</p>
      
      <p>
        You have been invited to join <strong>${tenant.name}</strong>.
      </p>
      
      <p>
        Please use the invite token below to accept your invitation:
      </p>
      
      <div style="
        margin: 20px 0;
        padding: 15px;
        background: #f4f6f8;
        border: 1px dashed #ccc;
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 1px;
      ">
        ${inviteToken}
      </div>
      
      <p>
        If you did not expect this invitation, you can safely ignore this email.
      </p>
      
      <p>Thanks,<br/>FGrow Team</p>
    </div>
  `,
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
  user.tenant_role = invitation.tenant_role;
  user.status = "active";

  await user.save();

  invitation.accepted_at = new Date();
  await invitation.save();

  return {
    message: "Joined successfully",
    user: user.toJSON(),
  };
};

/**
 * Fetch all pending invitations for a tenant
 */
export const fetchPendingInvitationsService = async (tenant_id) => {
  return await UserInvitation.find({
    tenant_id,
    accepted_at: null,
    expires_at: { $gt: new Date() },
  })
    .populate("invited_by", "name email")
    .sort({ createdAt: -1 });
};

/**
 * Revoke/Delete a pending invitation
 */
export const revokeInvitationService = async (invitationId, tenant_id) => {
  const invitation = await UserInvitation.findOne({
    _id: invitationId,
    tenant_id,
  });

  if (!invitation) {
    throw new Error("Invitation not found or unauthorized");
  }

  if (invitation.accepted_at) {
    throw new Error("Cannot revoke an already accepted invitation");
  }

  await UserInvitation.findByIdAndDelete(invitationId);

  return { message: "Invitation revoked successfully" };
};
