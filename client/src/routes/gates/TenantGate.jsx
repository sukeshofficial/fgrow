import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { reAppealTenant, getTenantById } from "../../api/tenant.api";
import { checkAuth } from "../../features/auth/auth.actions";
import { Button } from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import ReAppealModal from "../../components/tenant/ReAppealModal";

import WelcomePage from "../../pages/Welcome";
import TenantPendingScreen from "../../components/tenant/TenantPendingScreen";
import JoinAsStaff from "../../components/staff/JoinAsStaff";

import "../../styles/tenant-gate.css";

export const TenantGate = ({ children }) => {
  const [dismissedJoin, setDismissedJoin] = useState(false);
  const [isAppealing, setIsAppealing] = useState(false);
  const [showReAppealModal, setShowReAppealModal] = useState(false);
  const [freshTenant, setFreshTenant] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(false);
  const [toasts, setToasts] = useState([]);
  const { user, tenant, meState, invitation, dispatch } = useAuth();

  // Super Admin bypass
  if (user?.platform_role === "super_admin") {
    return children;
  }

  const hasTenant = !!user?.tenant_id;
  const verificationStatus = tenant?.verificationStatus;

  let overlay = null;

  const handleOpenReAppealModal = async () => {
    try {
      setLoadingTenant(true);
      const tenantId = user?.tenant_id || tenant?.id || tenant?._id;
      const res = await getTenantById(tenantId);
      setFreshTenant(res.data.data);
      setShowReAppealModal(true);
    } catch {
      // Fallback: open with whatever is in auth context
      setFreshTenant(null);
      setShowReAppealModal(true);
    } finally {
      setLoadingTenant(false);
    }
  };

  const handleReappealConfirm = async (formData) => {
    try {
      setIsAppealing(true);
      await reAppealTenant(formData);
      setShowReAppealModal(false);
      const id = Date.now();
      setToasts([{ id, message: "Re-appeal submitted! Awaiting admin review.", type: "success" }]);

      // Refresh auth state so dashboard transitions to pending screen
      setTimeout(async () => {
        await checkAuth(dispatch);
      }, 1500);
    } catch (err) {
      const id = Date.now();
      setToasts([{ id, message: err.response?.data?.message || "Appeal failed", type: "error" }]);
    } finally {
      setIsAppealing(false);
    }
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  if (!hasTenant || meState === "NO_TENANT") {
    return <WelcomePage />;
  }

  else if (meState === "INVITED" && !dismissedJoin) {
    overlay = (
      <JoinAsStaff
        initialToken={invitation?.token}
        onClose={() => setDismissedJoin(true)}
      />
    );
  }

  else if (
    meState === "PENDING_VERIFICATION" ||
    verificationStatus === "pending"
  ) {
    overlay = <TenantPendingScreen />;
  }

  else if (meState === "TENANT_INACTIVE") {
    overlay = (
      <div className="tenant-block-wrapper">
        <div className="tenant-block-card">
          <h2>Tenant inactive</h2>
          <p>Your tenant is inactive. Please contact support.</p>
        </div>
      </div>
    );
  }

  else if (
    meState === "TENANT_MISSING" ||
    meState === "REJECTED_VERIFICATION" ||
    verificationStatus === "rejected"
  ) {
    const isOwner = user?.tenant_role === "owner";
    overlay = (
      <div className="tenant-block-wrapper">
        <div className="tenant-block-card rejected-gate-card">
          <div className="rejected-badge">REJECTED</div>
          <h2>Access Denied</h2>
          <p className="rejection-general-text">
            Your organization <strong>{tenant?.name}</strong> has been rejected by the administrator.
          </p>

          {tenant?.rejection_reason && (
            <div className="rejection-reason-box">
              <span className="reason-label">Reason for rejection:</span>
              <p className="reason-text">{tenant.rejection_reason}</p>
            </div>
          )}

          <div className="gate-actions">
            {isOwner && (
              <Button
                variant="primary"
                onClick={handleOpenReAppealModal}
                disabled={isAppealing || loadingTenant}
                className="reappeal-btn"
              >
                {loadingTenant ? "Loading..." : "Submit Re-appeal"}
              </Button>
            )}
            <p className="support-hint">
              Need help? Contact <a href="mailto:sukesh.official.2006@gmail.com">support@forgegrid.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {overlay}

      {showReAppealModal && (
        <ReAppealModal
          tenant={freshTenant || tenant}
          onCancel={() => setShowReAppealModal(false)}
          onConfirm={handleReappealConfirm}
          submitting={isAppealing}
        />
      )}

      <div className="toast-container" style={{ zIndex: 20000 }}>
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </>
  );
};