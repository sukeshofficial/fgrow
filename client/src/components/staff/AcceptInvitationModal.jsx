import { useState } from "react";

import "../../styles/accept-invitation.css";

/**
 * AcceptInvitationModal
 *
 * Shown when a user has been invited to join an existing tenant.
 * Allows them to accept or decline the invitation.
 *
 * @param {object}   props
 * @param {object}   props.invitation  - Invitation data (tenantName, tenantLogo, invitedBy, role)
 * @param {Function} props.onAccept    - Called when the user clicks Accept
 * @param {Function} props.onDecline   - Called when the user clicks Decline
 */
export const AcceptInvitationModal = ({ invitation, onAccept, onDecline }) => {
    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false);
    const [error, setError] = useState("");

    const tenantName = invitation?.tenantName ?? "Unknown Organization";
    const tenantLogo = invitation?.tenantLogo ?? null;
    const invitedBy = invitation?.invitedBy ?? null;
    const role = invitation?.role ?? null;

    const handleAccept = async () => {
        if (accepting || declining) return;
        setError("");
        setAccepting(true);
        try {
            await onAccept?.();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to accept invitation. Please try again.",
            );
        } finally {
            setAccepting(false);
        }
    };

    const handleDecline = async () => {
        if (accepting || declining) return;
        setError("");
        setDeclining(true);
        try {
            await onDecline?.();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to decline invitation. Please try again.",
            );
        } finally {
            setDeclining(false);
        }
    };

    /* ─── initials fallback ─────────────────────────────────── */
    const initials = tenantName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");

    return (
        <div className="ai-overlay" aria-modal="true" role="dialog" aria-labelledby="ai-title">
            <div className="ai-modal">
                {/* ── Decorative gradient ring ── */}
                <div className="ai-glow" aria-hidden="true" />

                {/* ── Header ── */}
                <div className="ai-header">
                    <span className="ai-badge">Invitation</span>
                    <h2 className="ai-title" id="ai-title">
                        You&apos;ve been invited
                    </h2>
                    <p className="ai-subtitle">Review and respond to join the organization</p>
                </div>

                {/* ── Tenant card ── */}
                <div className="ai-tenant-card">
                    <div className="ai-tenant-avatar-wrap">
                        {tenantLogo ? (
                            <img
                                src={tenantLogo}
                                alt={`${tenantName} logo`}
                                className="ai-tenant-avatar-img"
                            />
                        ) : (
                            <span className="ai-tenant-avatar-initials">{initials}</span>
                        )}
                    </div>

                    <div className="ai-tenant-info">
                        <span className="ai-tenant-name">{tenantName}</span>
                        {role && (
                            <span className="ai-tenant-role-chip">{role}</span>
                        )}
                        {invitedBy && (
                            <span className="ai-tenant-invited-by">
                                Invited by <strong>{invitedBy}</strong>
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="ai-error" role="alert">
                        {error}
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="ai-actions">
                    <button
                        type="button"
                        id="ai-btn-accept"
                        className="btn ai-btn-accept"
                        onClick={handleAccept}
                        disabled={accepting || declining}
                    >
                        {accepting ? (
                            <>
                                <span className="ai-spinner" aria-hidden="true" />
                                Accepting…
                            </>
                        ) : (
                            <>
                                <svg className="ai-btn-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Accept
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        id="ai-btn-decline"
                        className="btn ai-btn-decline"
                        onClick={handleDecline}
                        disabled={accepting || declining}
                    >
                        {declining ? (
                            <>
                                <span className="ai-spinner ai-spinner-decline" aria-hidden="true" />
                                Declining…
                            </>
                        ) : (
                            <>
                                <svg className="ai-btn-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Decline
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvitationModal;
