import { useState } from "react";

import { useAuth } from "../../hooks/useAuth.js";
import { checkAuth } from "../../features/auth/auth.actions.js";

import "../../styles/tenant-pending.css";
import waitingIcon from "../../assets/wait-icon.png";

export const TenantPendingScreen = () => {
  const { tenant, dispatch, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await checkAuth(dispatch);
    } finally {
      setRefreshing(false);
    }
  };

  const createdAt =
    tenant && tenant.createdAt ? new Date(tenant.createdAt) : null;

  return (
    <div className="tenant-pending-overlay">
      <div className="tenant-pending-card">
        <div className="tenant-pending-icon">
          <img src={waitingIcon} alt="Waiting Icon" />
        </div>

        <h2 className="tenant-pending-title">
          Waiting for Super Admin Approval
        </h2>

        <p className="tenant-pending-text">
          Your organization has been submitted successfully and is currently
          under review. Once approved you will gain full access to the
          dashboard.
        </p>

        {tenant && (
          <div className="tenant-pending-meta">
            <div className="meta-row">
              <span className="meta-label">Tenant</span>
              <span className="meta-value">{tenant.name}</span>
            </div>

            {createdAt && (
              <div className="meta-row">
                <span className="meta-label">Submitted on</span>
                <span className="meta-value">
                  {createdAt.toLocaleString()}
                </span>
              </div>
            )}

            <div className="meta-row">
              <span className="meta-label">Status</span>
              <span className="meta-status pending">
                Pending Verification
              </span>
            </div>
          </div>
        )}

        <div className="tenant-pending-actions">
          <button
            type="button"
            className="btn refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Checking status..." : "Refresh Status"}
          </button>

          <button
            type="button"
            className="btn logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantPendingScreen;