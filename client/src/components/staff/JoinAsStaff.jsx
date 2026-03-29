import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { checkAuth } from "../../features/auth/auth.actions";
import { acceptInvitation, getInvitationDetails } from "../../api/invitation.api";
import logger from "../../utils/logger.js";

import "../../styles/welcome.css";

/**
 * JoinAsStaff
 *
 * Unified component for accepting invitations.
 * Used for both manual token entry and auto-filled invitations from the gate.
 */
export const JoinAsStaff = ({ onClose, initialToken }) => {
  const { user, dispatch } = useAuth();
  const [token, setToken] = useState(initialToken || "");
  const [tenantName, setTenantName] = useState("");
  const [tenantLogo, setTenantLogo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync token if initialToken changes (e.g. from props)
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      fetchInvitationDetails(initialToken);
    }
  }, [initialToken]);

  const fetchInvitationDetails = async (token) => {
    try {
      const response = await getInvitationDetails(token);
      setTenantName(response.data.data.tenant_id.name);
      setTenantLogo(response.data.data.tenant_id.logoUrl);
    } catch (err) {
      logger.error("JoinAsStaff", "Failed to fetch invitation details", err);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!token.trim()) {
      setError("Please enter an invitation token.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await acceptInvitation(token.trim());
      // Refresh auth state after accepting
      await checkAuth(dispatch);
      if (onClose) onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to accept invitation. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="welcome-modal-overlay"
      aria-modal="true"
      role="dialog"
      aria-labelledby="join-staff-title"
    >
      <div className="welcome-modal">
        {onClose && (
          <button
            type="button"
            className="welcome-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        )}

        <h2 id="join-staff-title" className="welcome-card-title">
          Join an Organization
        </h2>

        {tenantLogo && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.2rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              marginTop: '10px',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #eef2f6'
            }}>
              <img src={tenantLogo} alt={tenantName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        )}

        <p className="welcome-card-subtitle" style={{ marginBottom: "1.5rem" }}>
          {initialToken
            ? (
              <>
                You have been invited to join <strong>{tenantName || "an organization"}</strong>. Click join to proceed.
              </>
            )
            : "Enter the invitation token provided by your administrator."}
        </p>

        {error && (
          <div
            className="tenant-form-error"
            style={{ marginBottom: "1rem" }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="tenant-form">
          <div className="tenant-form-fields">
            <label className="tenant-label">
              Your Email
              <input
                type="email"
                className="tenant-input"
                value={user?.email || ""}
                disabled
              />
            </label>

            <label className="tenant-label" htmlFor="invite-token">
              <span className="tenant-label-text">
                Invitation Token <span className="tenant-required">*</span>
              </span>              <input
                type="text"
                id="invite-token"
                className="tenant-input"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError("");
                }}
                placeholder="Paste token here"
                autoFocus={!initialToken}
                readOnly={!!initialToken}
                style={initialToken ? { backgroundColor: "#f9fafb", cursor: "not-allowed" } : {}}
              />
            </label>
          </div>

          <div
            className="tenant-actions"
            style={{ marginTop: "1.5rem" }}
          >
            {onClose ? (
              <button
                type="button"
                className="welcome-btn welcome-btn-md welcome-btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
            ) : (
              <div /> // Spacer
            )}
            <button
              type="submit"
              className="welcome-btn welcome-btn-md welcome-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Joining..." : "Join Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinAsStaff;
