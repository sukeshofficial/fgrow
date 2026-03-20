import { useState } from "react";

import { useAuth } from "../../hooks/useAuth.js";
import { checkAuth } from "../../features/auth/auth.actions.js";
import { HiOutlineClock } from "react-icons/hi2";

import "../../styles/tenant-pending.css";

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
        {/* Animated Hero Icon Layer */}
        <div className="tenant-pending-hero">
          <div className="icon-glow-ring"></div>
          <div className="tenant-pending-icon-wrapper">
            <HiOutlineClock size={40} className="pending-clock-icon" />
          </div>
        </div>

        <h2 className="tenant-pending-title">
          Waiting for Admin Approval
        </h2>

        <p className="tenant-pending-text">
          Your organization has been submitted successfully and is currently
          under review. You'll gain full access once approved.
        </p>

        {tenant && (
          <div className="tenant-info-glass-card">
            <div className="info-item">
              <span className="info-label">Organization</span>
              <span className="info-value">{tenant.name}</span>
            </div>

            {createdAt && (
              <div className="info-item">
                <span className="info-label">Submitted on</span>
                <span className="info-value">
                  {createdAt.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            )}

            <div className="info-item">
              <span className="info-label">Current Status</span>
              <div className="status-badge-elegant pending">
                <div className="status-indicator-dot"></div>
                Pending Verification
              </div>
            </div>
          </div>
        )}

        <div className="tenant-gate-actions">
          <button
            type="button"
            className="premium-btn premium-btn-primary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Checking..." : "Refresh Status"}
          </button>

          <button
            type="button"
            className="premium-btn premium-btn-secondary"
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