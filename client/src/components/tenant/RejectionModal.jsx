import React, { useState } from "react";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { Button } from "../ui/Button";
import "../../styles/rejection-modal.css";

const RejectionModal = ({ tenantName, onConfirm, onCancel, submitting }) => {
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
          <div className="rejection-warning-icon">
            <FaExclamationTriangle />
          </div>
          <h2 className="tenant-modal-title">Reject Tenant</h2>
          <p className="tenant-modal-subtitle">
            Providing a reason helps <strong>{tenantName}</strong> understand what to fix.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rejection-form">
          <div className="rejection-field">
            <label htmlFor="rejection-reason" className="tenant-label">
              <span className="tenant-label-heading">Rejection Reason <span className="tenant-required">*</span></span>
              <textarea
                id="rejection-reason"
                className="tenant-input rejection-textarea"
                placeholder="e.g., Missing documents, invalid GSTIN..."
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
              {submitting ? "Rejecting..." : "Reject Tenant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectionModal;
