import React from 'react';
import { useModal } from '../../context/ModalContext';
import {
    FiInfo,
    FiCheckCircle,
    FiAlertTriangle,
    FiXCircle,
    FiTrash2,
    FiHelpCircle
} from 'react-icons/fi';
import '../../styles/global-modal.css';

const GlobalModal = () => {
    const { modal, handleConfirm, handleCancel } = useModal();

    if (!modal.isOpen) return null;

    const getIcon = () => {
        switch (modal.type) {
            case 'success': return <FiCheckCircle className="icon-success" />;
            case 'error': return <FiXCircle className="icon-error" />;
            case 'warning': return <FiAlertTriangle className="icon-warning" />;
            case 'delete': return <FiTrash2 className="icon-delete" />;
            case 'confirm': return <FiHelpCircle className="icon-confirm" />;
            default: return <FiInfo className="icon-info" />;
        }
    };

    const getIconClass = () => {
        return `global-modal-icon icon-${modal.type}`;
    };

    const getConfirmBtnClass = () => {
        if (modal.type === 'delete') return 'modal-btn btn-danger';
        return 'modal-btn btn-primary';
    };

    return (
        <div className="global-modal-overlay" onClick={modal.cancelLabel ? handleCancel : handleConfirm}>
            <div className="global-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="global-modal-content">
                    <div className={getIconClass()}>
                        {getIcon()}
                    </div>
                    <h2 className="global-modal-title">{modal.title}</h2>
                    <p className="global-modal-message">{modal.message}</p>
                </div>

                <div className="global-modal-actions">
                    {modal.cancelLabel && (
                        <button
                            className="modal-btn btn-secondary"
                            onClick={handleCancel}
                        >
                            {modal.cancelLabel}
                        </button>
                    )}
                    <button
                        className={getConfirmBtnClass()}
                        onClick={handleConfirm}
                    >
                        {modal.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalModal;
