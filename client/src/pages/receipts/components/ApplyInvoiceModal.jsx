import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiInfo, FiHash, FiZap } from "react-icons/fi";
import receiptService from "../../../features/receipts/receiptService";
import { Spinner } from "../../../components/ui/Spinner";
import logger from "../../../utils/logger";

const ApplyInvoiceModal = ({ isOpen, onClose, clientId, receiptId, availableAmount, onApplied }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [allocations, setAllocations] = useState({}); // { invoiceId: amount }
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && clientId) {
            fetchUnpaidInvoices();
        }
    }, [isOpen, clientId]);

    const fetchUnpaidInvoices = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await receiptService.getUnpaidInvoices(clientId);
            setInvoices(response.data || []);
        } catch (err) {
            logger.error("ApplyInvoiceModal", "Failed to fetch unpaid invoices", err);
            setError("Failed to load outstanding invoices.");
        } finally {
            setLoading(false);
        }
    };

    const handleAllocationChange = (invoiceId, value, balance) => {
        const amount = parseFloat(value) || 0;
        setAllocations(prev => ({
            ...prev,
            [invoiceId]: amount
        }));
    };

    const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);

    const handleSubmit = async () => {
        if (totalAllocated <= 0) {
            setError("Please allocate at least some amount.");
            return;
        }
        if (totalAllocated > availableAmount) {
            setError(`Total allocation (₹${totalAllocated}) exceeds available receipt balance (₹${availableAmount}).`);
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const payload = Object.entries(allocations)
                .filter(([_, amt]) => amt > 0)
                .map(([id, amt]) => ({ invoiceId: id, amount: amt }));

            await receiptService.applyToInvoices(receiptId, payload);
            onApplied();
            onClose();
        } catch (err) {
            logger.error("ApplyInvoiceModal", "Submit failed", err);
            setError(err.response?.data?.message || "Failed to apply invoices.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAutoApply = () => {
        let remaining = availableAmount;
        const newAllocs = {};
        for (const inv of invoices) {
            if (remaining <= 0) break;
            const toApply = Math.min(remaining, (inv.balance_due || 0));
            if (toApply > 0) {
                newAllocs[inv._id] = toApply;
                remaining -= toApply;
            }
        }
        setAllocations(newAllocs);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="modal-content" style={{
                background: 'white', borderRadius: '24px', width: '900px', maxWidth: '95%',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div className="modal-header" style={{
                    padding: '24px 32px', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Apply Receipt to Invoices</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                                Available Balance: <strong style={{ color: '#10b981' }}>₹{availableAmount?.toLocaleString('en-IN')}</strong>
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleAutoApply}
                            disabled={invoices.length === 0}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                background: invoices.length === 0 ? '#f1f5f9' : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                                color: invoices.length === 0 ? '#94a3b8' : 'white',
                                border: 'none',
                                borderRadius: '999px',
                                cursor: invoices.length === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                boxShadow: invoices.length === 0 ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.2)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <FiZap size={13} style={{ fill: invoices.length === 0 ? 'transparent' : 'rgba(255,255,255,0.2)' }} /> Auto Apply
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                    >
                        <FiX size={18} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px' }}><Spinner /></div>
                    ) : error && invoices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                            <FiInfo size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <p>{error}</p>
                            <button onClick={fetchUnpaidInvoices} className="action-btn-styled" style={{ margin: '0 auto' }}>Retry</button>
                        </div>
                    ) : invoices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px' }}>
                            <FiCheck size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
                            <h4 style={{ margin: 0, color: '#1e293b' }}>All Invoices Settled</h4>
                            <p style={{ color: '#64748b' }}>There are no outstanding invoices for this client.</p>
                        </div>
                    ) : (
                        <>
                            {error && <div style={{
                                padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
                                borderRadius: '12px', color: '#b91c1c', fontSize: '0.875rem', marginBottom: '20px'
                            }}>{error}</div>}

                            <table className="applied-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8' }}>Invoice No</th>
                                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8' }}>Date</th>
                                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8' }}>Balance Due</th>
                                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', width: '200px' }}>Amount to Apply</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: 700, color: '#4f46e5' }}>{inv.invoice_no}</div>
                                            </td>
                                            <td style={{ padding: '16px', color: '#64748b', fontSize: '0.875rem' }}>
                                                {new Date(inv.date).toLocaleDateString('en-IN')}
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: 600, color: '#1e293b' }}>
                                                ₹{inv.balance_due?.toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>₹</span>
                                                    <input
                                                        type="number"
                                                        value={allocations[inv._id] || ""}
                                                        onChange={(e) => handleAllocationChange(inv._id, e.target.value, inv.balance_due)}
                                                        placeholder="0.00"
                                                        style={{
                                                            width: '100%', padding: '10px 12px 10px 24px', borderRadius: '10px',
                                                            border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem'
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                <div className="modal-footer" style={{
                    padding: '24px 32px', borderTop: '1px solid #f1f5f9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f8fafc'
                }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Total Allocated: <strong style={{ color: totalAllocated > availableAmount ? '#ef4444' : '#1e293b' }}>₹{totalAllocated.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={onClose} disabled={submitting} className="action-btn-styled">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || totalAllocated <= 0 || totalAllocated > availableAmount}
                            className="action-btn-styled"
                            style={{
                                background: '#4f46e5', color: 'white', border: 'none',
                                opacity: (submitting || totalAllocated <= 0 || totalAllocated > availableAmount) ? 0.6 : 1
                            }}
                        >
                            {submitting ? 'Applying...' : 'Apply Settlement'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplyInvoiceModal;
