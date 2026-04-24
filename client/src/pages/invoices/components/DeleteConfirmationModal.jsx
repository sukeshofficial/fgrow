import React from "react";
import { FiX, FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import "./DeleteConfirmationModal.css";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="delete-modal-overlay">
            <div className="delete-modal-content">
                <div className="delete-modal-header">
                    <div className="delete-warning-icon">
                        <FiAlertTriangle size={24} />
                    </div>
                    <button className="delete-modal-close" onClick={onClose}>
                        <FiX size={18} />
                    </button>
                </div>

                <div className="delete-modal-body">
                    <h2 className="delete-modal-title">Confirm Deletion</h2>
                    <p className="delete-modal-text">
                        Are you sure you want to delete <strong>{count} {count === 1 ? 'invoice' : 'invoices'}</strong>? This action cannot be undone.
                    </p>
                </div>

                <div className="delete-modal-footer">
                    <button
                        className="delete-modal-btn-cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="delete-modal-btn-confirm"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="delete-spinner"></div>
                        ) : (
                            <><FiTrash2 size={16} /> Delete Now</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
