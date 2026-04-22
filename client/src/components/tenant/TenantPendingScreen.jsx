import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth.js";
import { checkAuth } from "../../features/auth/auth.actions.js";
import { getTenantById } from "../../api/tenant.api.js";
import { FiRefreshCcw, FiLogOut, FiCheckCircle, FiInfo, FiClock, FiBriefcase } from "react-icons/fi";

import "../../styles/tenant-pending.css";

export const TenantPendingScreen = () => {
  const { user, dispatch, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetch tenant details using TanStack Query
   * Matches the approach in Dashboard.jsx
   */
  const { data: tenantDetails, isLoading: tenantLoading, refetch } = useQuery({
    queryKey: ["tenant-details", user?.tenant_id],
    queryFn: async () => {
      const response = await getTenantById(user.tenant_id);
      return response.data.data;
    },
    enabled: !!user?.tenant_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both Auth session and Tenant details
      await Promise.all([
        checkAuth(dispatch),
        refetch()
      ]);
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  const createdAt =
    tenantDetails && tenantDetails.createdAt ? new Date(tenantDetails.createdAt) : null;

  return (
    <div className="tenant-pending-overlay">
      <div className="tenant-pending-card">
        {/* Brand Area */}
        <div className="tenant-pending-brand">
          <div className="brand-icon">
            {tenantDetails?.logoUrl ? (
              <img
                src={tenantDetails.logoUrl}
                alt="Logo"
                style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }}
              />
            ) : (
              <FiBriefcase size={20} />
            )}
          </div>
          <span className="setup-indicator">Account setup in progress</span>
        </div>

        {/* Hero Section */}
        <div className="hero-content">
          <h2 className="tenant-pending-title">Waiting for Admin Approval</h2>
          <p className="tenant-pending-text">
            Your organization has been submitted successfully. Our team is currently reviewing
            your profile to ensure everything is in order.
          </p>
        </div>

        {/* Status Panel */}
        {tenantDetails && (
          <div className="status-panel">
            <div className="status-panel-item full-width">
              <span className="panel-label">Organization Name</span>
              <span className="panel-value">{tenantDetails.name}</span>
            </div>

            {createdAt && (
              <div className="status-panel-item">
                <span className="panel-label">Submitted On</span>
                <span className="panel-value">
                  {createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            <div className="status-panel-item">
              <span className="panel-label">Current Status</span>
              <div className="status-badge-elegant">
                <div className="status-dot-pulse"></div>
                {tenantDetails.verificationStatus || "Pending Verification"}
              </div>
            </div>
          </div>
        )}

        {/* Guidance Section */}
        <div className="guidance-section">
          <ul className="guidance-list">
            <li className="guidance-item">
              <FiCheckCircle className="guidance-icon" />
              <span>We'll notify you via email once your account is fully verified.</span>
            </li>
            <li className="guidance-item">
              <FiClock className="guidance-icon" />
              <span>This usually takes a short review period (typically 24-48 hours).</span>
            </li>
            <li className="guidance-item">
              <FiInfo className="guidance-icon" />
              <span>You can refresh this page to check for status updates at any time.</span>
            </li>
          </ul>
        </div>

        {/* Action Area */}
        <div className="tenant-gate-actions">
          <button
            type="button"
            className="premium-btn btn-primary"
            onClick={handleRefresh}
            disabled={refreshing || tenantLoading}
          >
            <FiRefreshCcw className={refreshing ? "spin-icon" : ""} />
            {refreshing ? "Checking Status..." : "Refresh Status"}
          </button>

          <button
            type="button"
            className="premium-btn btn-secondary"
            onClick={logout}
          >
            <FiLogOut />
            Logout from Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantPendingScreen;