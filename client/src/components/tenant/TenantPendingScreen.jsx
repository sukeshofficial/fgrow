import { useState } from "react";

import { useAuth } from "../../hooks/useAuth.js";
import { checkAuth } from "../../features/auth/auth.actions.js";

export const TenantPendingScreen = () => {
  const { tenant, meState, dispatch, logout } = useAuth();
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
    <div className="tenant-pending-wrapper">
      <div className="tenant-pending-card">
        <div className="tenant-pending-icon" aria-hidden="true">
          ⏳
        </div>

        <h2 className="tenant-pending-title">
          Wait for Super ADMIN Approval
        </h2>

        <p className="tenant-pending-text">
          Your organization details have been submitted and are currently
          under review by the Super Admin.
        </p>

        {tenant && (
          <div className="tenant-pending-meta">
            <div className="tenant-meta-row">
              <span className="tenant-meta-label">Tenant</span>
              <span className="tenant-meta-value">{tenant.name}</span>
            </div>
            {createdAt && (
              <div className="tenant-meta-row">
                <span className="tenant-meta-label">Submitted on</span>
                <span className="tenant-meta-value">
                  {createdAt.toLocaleString()}
                </span>
              </div>
            )}
            {meState && (
              <div className="tenant-meta-row">
                <span className="tenant-meta-label">Status</span>
                <span className="tenant-meta-value">
                  Pending verification ({meState})
                </span>
              </div>
            )}
          </div>
        )}

        <div className="tenant-pending-actions">
          <button
            type="button"
            className="btn tenant-btn-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Checking status..." : "Refresh status"}
          </button>

          <button
            type="button"
            className="btn ghost tenant-btn-logout"
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

