import React, { useState, useEffect } from "react";
import { FiX, FiDollarSign, FiCalendar, FiHash, FiFileText, FiCheck } from "react-icons/fi";
import "./RecordPaymentModal.css";

const RecordPaymentModal = ({ isOpen, onClose, onRecord, balanceDue, loading }) => {
    const [formData, setFormData] = useState({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        method: "bank_transfer",
        reference: "",
        note: ""
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                amount: balanceDue || ""
            }));
        }
    }, [isOpen, balanceDue]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onRecord(formData);
    };

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal-content">
                <div className="payment-modal-header">
                    <button className="payment-modal-close" onClick={onClose} title="Close">
                        <FiX size={18} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="payment-modal-icon-wrapper">
                            <FiDollarSign size={24} />
                        </div>
                        <div>
                            <h2 className="payment-modal-title">Record Payment</h2>
                            <p className="payment-modal-subtitle">Add a full or partial payment to this invoice</p>
                        </div>
                    </div>
                </div>

                <form className="payment-modal-form" onSubmit={handleSubmit}>
                    <div className="payment-modal-grid">
                        <div className="payment-modal-field">
                            <label className="payment-modal-label">
                                <FiDollarSign size={14} /> Amount Received
                            </label>
                            <input
                                type="number"
                                name="amount"
                                className="payment-modal-input"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                max={balanceDue}
                                step="0.01"
                                placeholder="0.00"
                            />
                            <span className="field-hint">Max: ₹{balanceDue?.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="payment-modal-field">
                            <label className="payment-modal-label">
                                <FiCalendar size={14} /> Payment Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                className="payment-modal-input"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="payment-modal-field">
                            <label className="payment-modal-label">
                                <FiFileText size={14} /> Payment Method
                            </label>
                            <select
                                name="method"
                                className="payment-modal-input"
                                value={formData.method}
                                onChange={handleChange}
                                required
                            >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash</option>
                                <option value="cheque">Cheque</option>
                                <option value="online">Online Payment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="payment-modal-field">
                            <label className="payment-modal-label">
                                <FiHash size={14} /> Reference No.
                            </label>
                            <input
                                type="text"
                                name="reference"
                                className="payment-modal-input"
                                value={formData.reference}
                                onChange={handleChange}
                                placeholder="Transaction ID / Cheque No."
                            />
                        </div>
                    </div>

                    <div className="payment-modal-field" style={{ marginTop: '24px' }}>
                        <label className="payment-modal-label">
                            <FiFileText size={14} /> Notes
                        </label>
                        <textarea
                            name="note"
                            className="payment-modal-input"
                            value={formData.note}
                            onChange={handleChange}
                            style={{ height: '80px', resize: 'none' }}
                            placeholder="Internal notes about this payment..."
                        />
                    </div>

                    <div className="payment-modal-footer">
                        <button
                            type="button"
                            className="payment-modal-btn-secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="payment-modal-btn-primary"
                            disabled={loading || !formData.amount || formData.amount <= 0}
                        >
                            {loading ? (
                                <div className="payment-spinner"></div>
                            ) : (
                                <><FiCheck size={18} /> Record Payment</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
