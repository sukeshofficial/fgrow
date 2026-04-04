import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { Spinner } from "../components/ui/Spinner";

import WelcomeCard from "../components/tenant/WelcomeCard";
import CreateTenantModal from "../components/tenant/CreateTenantModal";
import JoinAsStaff from "../components/staff/JoinAsStaff";
import Toast from "../components/ui/Toast";
import { getInvitationDetails } from "../api/invitation.api";
import logger from "../utils/logger.js";

import "../styles/welcome.css";

export const WelcomePage = () => {
  const { user, meState, isLoading, invitation, logout } = useAuth();

  const [activeFlow, setActiveFlow] = useState(null);
  const [toast, setToast] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);

  useEffect(() => {
    if (invitation?.token) {
      fetchInvitationDetails(invitation.token);
    }
  }, [invitation?.token]);

  const fetchInvitationDetails = async (token) => {
    try {
      const response = await getInvitationDetails(token);
      setTenantInfo(response.data.data.tenant_id);
    } catch (err) {
      logger.error("WelcomePage", "Failed to fetch invitation details", err);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Fallback edge case handler: if state is unrecognized but we somehow end up here
  if (!["NO_TENANT", "INVITED", "PENDING_VERIFICATION", "ACTIVE", "TENANT_INACTIVE", "TENANT_MISSING", "REJECTED_VERIFICATION"].includes(meState)) {
    logger.error("WelcomePage", "Unrecognized meState", { meState, user, invitation });
    return (
      <div className="welcome-page">
        <div style={{ textAlign: 'center', background: 'white', padding: '2rem', borderRadius: '12px' }}>
          <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
          <p>We couldn't determine your account state. <br /> Please try reloading the page.</p>
          <button className="welcome-btn welcome-btn-primary" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }

  const handleCreateTenant = () => {
    if (invitation) {
      setToast({
        message: `Cannot create tenant since ${tenantInfo?.name || invitation.tenantName || 'an organization'} invited you to join`,
        type: "error"
      });
      return;
    }
    setActiveFlow("create-tenant");
  };

  const handleJoinAsStaff = () => {
    if (invitation) {
      setActiveFlow("join-staff-prefilled");
    } else {
      setActiveFlow("join-staff-manual");
    }
  };

  const closeFlow = () => {
    setActiveFlow(null);
  };

  return (
    <div className="welcome-page">
      <button className="welcome-logout-btn" onClick={logout}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        Logout
      </button>

      <WelcomeCard
        onCreateTenant={handleCreateTenant}
        onJoinAsStaff={handleJoinAsStaff}
      />

      {/* Nested Flows */}
      {activeFlow === "create-tenant" && (
        <CreateTenantModal onClose={closeFlow} />
      )}

      {(activeFlow === "join-staff-prefilled" || activeFlow === "join-staff-manual") && (
        <JoinAsStaff
          onClose={closeFlow}
          initialToken={activeFlow === "join-staff-prefilled" ? invitation?.token : null}
        />
      )}
      <div className="toast-container" style={{ zIndex: 20000 }}>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default WelcomePage;
