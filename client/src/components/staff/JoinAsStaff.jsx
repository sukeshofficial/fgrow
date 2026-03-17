import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { checkAuth } from "../../features/auth/auth.actions";
import { acceptInvitation } from "../../api/invitation.api";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync token if initialToken changes (e.g. from props)
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

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
        <p className="welcome-card-subtitle" style={{ marginBottom: "1.5rem" }}>
          {initialToken
            ? "You have been invited to join an organization. Click join to proceed."
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
              Invitation Token <span className="tenant-required">*</span>
              <input
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
                className="welcome-btn welcome-btn-secondary"
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
              className="welcome-btn welcome-btn-primary"
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
