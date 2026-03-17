/**
 * InvitationGate
 * Simple guard for staff users who were invited but haven't accepted yet.
 * Shows AcceptInvitationModal when meState === "INVITED".
 */

import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import JoinAsStaff from "../../components/staff/JoinAsStaff";

const InvitationGate = ({ children }) => {
  const [dismissed, setDismissed] = useState(false);
  const { meState, invitation } = useAuth();

  if (meState === "INVITED" && !dismissed) {
    return (
      <JoinAsStaff 
        initialToken={invitation?.token} 
        onClose={() => setDismissed(true)} 
      />
    );
  }

  return children;
};

export default InvitationGate;