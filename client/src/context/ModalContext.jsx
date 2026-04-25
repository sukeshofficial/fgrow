import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // 'info', 'success', 'warning', 'error', 'confirm', 'delete'
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        resolve: null,
    });

    const showAlert = useCallback((title, message, type = 'info') => {
        return new Promise((resolve) => {
            setModal({
                isOpen: true,
                title,
                message,
                type,
                confirmLabel: 'OK',
                cancelLabel: null,
                resolve,
            });
        });
    }, []);

    const showConfirm = useCallback((title, message, type = 'confirm', options = {}) => {
        return new Promise((resolve) => {
            setModal({
                isOpen: true,
                title,
                message,
                type,
                confirmLabel: options.confirmLabel || (type === 'delete' ? 'Delete' : 'Confirm'),
                cancelLabel: options.cancelLabel || 'Cancel',
                resolve,
            });
        });
    }, []);

    const handleConfirm = () => {
        if (modal.resolve) modal.resolve(true);
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleCancel = () => {
        if (modal.resolve) modal.resolve(false);
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const openReportModal = useCallback(() => setIsReportModalOpen(true), []);
    const closeReportModal = useCallback(() => setIsReportModalOpen(false), []);

    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    const openFeedbackModal = useCallback(() => setIsFeedbackModalOpen(true), []);
    const closeFeedbackModal = useCallback(() => setIsFeedbackModalOpen(false), []);

    return (
        <ModalContext.Provider value={{
            showAlert,
            showConfirm,
            modal,
            handleConfirm,
            handleCancel,
            isReportModalOpen,
            openReportModal,
            closeReportModal,
            isFeedbackModalOpen,
            openFeedbackModal,
            closeFeedbackModal
        }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
