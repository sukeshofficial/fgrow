import { FiTrash2, FiX } from "react-icons/fi";
import "../../styles/delete-modal.css";

const DeleteModal = ({ title, message, onConfirm, onCancel, submitting }) => {
  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-content">
          <div className="delete-icon-wrapper">
            <FiTrash2 />
          </div>
          <div className="delete-text-content">
            <h2 className="delete-modal-title">{title}</h2>
            <p className="delete-modal-message">{message}</p>
          </div>
        </div>
        
        <div className="delete-modal-actions">
          <button className="delete-cancel-btn" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button className="delete-confirm-btn" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
