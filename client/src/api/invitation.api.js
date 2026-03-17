// invitationApi.js
import { api } from "./api";

/**
 * Invite User
 * POST /invitation/invite
 */
export const inviteUser = ({ email, tenant_role }) => {
  return api.post("/invitation/invite", {
    email,
    tenant_role,
  });
};

/**
 * Accept Invitation
 * POST /invitation/accept
 */
export const acceptInvitation = (token) => {
  return api.post("/invitation/accept", {
    token,
  });
};

/**
 * Get Pending Invitations (Owner)
 */
export const getPendingInvitations = () => {
  return api.get("/invitation/pending");
};

/**
 * Revoke Invitation (Owner)
 */
export const revokeInvitation = (invitationId) => {
  return api.delete(`/invitation/${invitationId}`);
};