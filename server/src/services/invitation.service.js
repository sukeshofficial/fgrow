import crypto from "crypto";

import Tenant from "../models/tenant/tenant.model.js";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

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
  logger.info(`Inviting user to tenant: ${tenant_id} email: ${email}`);
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
    subject: `You're invited to join ${tenant.name} on FGrow 🎉`,
    html: `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 40px 20px; text-align: center;">
          <img 
            src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1775310579/tenants/a7tvcuo0moqztzeoevaz.png" 
            alt="Logo"
            style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.3); margin-bottom: 20px;"
          />
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Organization Invitation</h1>
        </div>
        
        <div style="padding: 40px;">
          <p style="margin-top: 0; font-size: 16px; font-weight: 600; color: #1e293b;">Welcome!</p>
          <p style="font-size: 16px; color: #475569;">You have been invited to join <strong>${tenant.name}</strong> on FGrow. We're excited to have you on board!</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Your Invitation Token</p>
            <div style="
              background: #ffffff;
              border: 2px dashed #7c3aed;
              border-radius: 12px;
              padding: 16px;
              font-family: 'Courier New', Courier, monospace;
              font-size: 20px;
              font-weight: 800;
              color: #7c3aed;
              letter-spacing: 2px;
            ">
              ${inviteToken}
            </div>
          </div>

          <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">
            Please use this token to accept your invitation in the FGrow portal. If you did not expect this invitation, you can safely ignore this email.
          </p>

          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">Thanks,<br/><strong>FGrow Team</strong></p>
        </div>

        <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px; font-weight: 600;">Sent by <strong>${tenant.name}</strong> via FGrow</p>
        </div>
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

/**
 * Get invitation details by token
 */
export const getInvitationByTokenService = async (token) => {
  const invitation = await UserInvitation.findOne({
    invite_token: token,
    accepted_at: null,
    expires_at: { $gt: new Date() },
  }).populate("tenant_id", "name logoUrl");

  if (!invitation) {
    throw new Error("Invalid or expired invitation");
  }

  return invitation;
};
