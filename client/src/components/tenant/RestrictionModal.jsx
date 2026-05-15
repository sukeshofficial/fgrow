import React, { useState } from "react";
import { FaTimes, FaLock } from "react-icons/fa";
import { Button } from "../ui/Button";
import "../../styles/rejection-modal.css";

/**
 * RestrictionModal
 *
 * Used by Super Admins to provide a reason when manually restricting tenant access.
 */
const RestrictionModal = ({ tenantName, onConfirm, onCancel, submitting }) => {
    const [reason, setReason] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        onConfirm(reason);
    };

    return (
        <div className="tenant-modal-overlay">
            <div className="tenant-modal rejection-modal">
                <button className="tenant-modal-close" onClick={onCancel}>
                    <FaTimes />
                </button>

                <div className="rejection-modal-header">
                    <div className="rejection-warning-icon" style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}>
                        <FaLock />
                    </div>
                    <h2 className="tenant-modal-title">Restrict Access</h2>
                    <p className="tenant-modal-subtitle">
                        Provide a reason to inform <strong>{tenantName}</strong> why their access is being restricted.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="rejection-form">
                    <div className="rejection-field">
                        <label htmlFor="restriction-reason" className="tenant-label">
                            <span className="tenant-label-heading">Restriction Reason <span className="tenant-required">*</span></span>
                            <textarea
                                id="restriction-reason"
                                className="tenant-input rejection-textarea"
                                placeholder="e.g., Policy violation, overdue payment, etc..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                                rows={4}
                                autoFocus
                            />
                        </label>
                    </div>

                    <div className="rejection-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={submitting}
                            className="rejection-cancel-btn"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={submitting || !reason.trim()}
                            className="rejection-confirm-btn"
                            style={{ backgroundColor: '#ef4444' }}
                        >
                            {submitting ? "Processing..." : "Restrict Access"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RestrictionModal;
