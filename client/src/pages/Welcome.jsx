import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { Spinner } from "../components/ui/Spinner";

import WelcomeCard from "../components/tenant/WelcomeCard";
import WelcomeModal from "../components/tenant/WelcomeModal";
import CreateTenantModal from "../components/tenant/CreateTenantModal";
import JoinAsStaff from "../components/staff/JoinAsStaff";

import "../styles/welcome.css";

const WELCOME_SHOWN_KEY = "fgrow_welcome_shown";

export const WelcomePage = () => {
  const { user, meState, isLoading, invitation } = useAuth();

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null); // 'create-tenant', 'join-staff-prefilled', 'join-staff-manual'

  useEffect(() => {
    if (!isLoading && meState === "NO_TENANT") {
      const hasSeenWelcome = localStorage.getItem(WELCOME_SHOWN_KEY);
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
        localStorage.setItem(WELCOME_SHOWN_KEY, "true");
      }
    }
  }, [isLoading, meState]);

  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Fallback edge case handler: if state is unrecognized but we somehow end up here
  if (!["NO_TENANT", "INVITED", "PENDING_VERIFICATION", "ACTIVE", "TENANT_INACTIVE", "TENANT_MISSING", "REJECTED_VERIFICATION"].includes(meState)) {
    console.error("Unrecognized meState:", meState, "Full state:", { meState, user, invitation });
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

  // The main view for NO_TENANT
  const handleCreateTenant = () => {
    setShowWelcomeModal(false);
    setActiveFlow("create-tenant");
  };

  const handleJoinAsStaff = () => {
    setShowWelcomeModal(false);
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
      <WelcomeCard
        onCreateTenant={handleCreateTenant}
        onJoinAsStaff={handleJoinAsStaff}
      />

      {/* Auto-opening modal on first visit */}
      <WelcomeModal
        open={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
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
    </div>
  );
};

export default WelcomePage;
