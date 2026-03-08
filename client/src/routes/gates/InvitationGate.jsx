/**
 * InvitationGate
 * Simple guard for staff users who were invited but haven't accepted yet.
 * Shows AcceptInvitationModal when meState === "INVITED".
 */

import { useAuth } from "../../hooks/useAuth";
import { AcceptInvitationModal } from "../../components/staff/AcceptInvitationModal.jsx";

const InvitationGate = ({ children }) => {
  const { meState } = useAuth();

  if (meState === "INVITED") {
    return <AcceptInvitationModal />;
  }

  return children;
};

export default InvitationGate;