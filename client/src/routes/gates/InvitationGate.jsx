/**
 * InvitationGate
 * Simple guard for staff users who were invited but haven't accepted yet.
 * Shows AcceptInvitationModal when meState === "INVITED".
 */

import { useAuth } from "../../hooks/useAuth";
import JoinAsStaff from "../../components/staff/JoinAsStaff";

const InvitationGate = ({ children }) => {
  const { meState, invitation } = useAuth();

  if (meState === "INVITED") {
    return <JoinAsStaff initialToken={invitation?.token} />;
  }

  return children;
};

export default InvitationGate;