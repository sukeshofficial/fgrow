import { FaCheckCircle, FaTimes } from "react-icons/fa";
import { Button } from "../ui/Button";
import "../../styles/rejection-modal.css";

const ConfirmModal = ({ title, message, confirmLabel = "Confirm", confirmColor = "#22c55e", onConfirm, onCancel, submitting }) => {
  return (
    <div className="tenant-modal-overlay" aria-modal="true" role="dialog">
      <div className="tenant-modal rejection-modal" style={{ maxWidth: 420 }}>
        <button className="tenant-modal-close" onClick={onCancel} aria-label="Close">
          <FaTimes />
        </button>

        <div className="rejection-modal-header">
          <div className="rejection-warning-icon" style={{ background: "#f0fdf4", color: confirmColor }}>
            <FaCheckCircle />
          </div>
          <h2 className="tenant-modal-title">{title}</h2>
          <p className="tenant-modal-subtitle">{message}</p>
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
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={submitting}
            className="rejection-confirm-btn"
            style={{ backgroundColor: confirmColor }}
          >
            {submitting ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
