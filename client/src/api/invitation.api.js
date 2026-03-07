// invitationApi.js
import { api } from "./api";

/**
 * Invite Staff
 * POST /invitation/invite
 */
export const inviteUser = ({ email, role }) => {
  return api.post("/invitation/invite", {
    email,
    role,
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