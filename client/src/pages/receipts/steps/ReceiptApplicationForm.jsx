import React, { useState, useEffect } from "react";
import { FiFileText, FiZap, FiAlertCircle, FiChevronRight } from "react-icons/fi";
import receiptService from "../../../features/receipts/receiptService";
import { Spinner } from "../../../components/ui/Spinner";
import logger from "../../../utils/logger";

const ReceiptApplicationForm = ({ data, onSubmit, onBack, loading }) => {
    const [invoices, setInvoices] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [allocations, setAllocations] = useState({}); // { invoiceId: amount }
    const [availableAmount, setAvailableAmount] = useState(data.total_amount);

    useEffect(() => {
        if (data.allocations && data.allocations.length > 0) {
            const initialAllocs = {};
            data.allocations.forEach(a => {
                initialAllocs[a.invoiceId] = a.amount;
            });
            setAllocations(initialAllocs);
            const totalApplied = data.allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
            setAvailableAmount(data.total_amount - totalApplied);
        } else {
            setAvailableAmount(data.total_amount);
        }
    }, [data.allocations, data.total_amount]);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const resp = await receiptService.getUnpaidInvoices(data.client);
                setInvoices(resp.data || []);
            } catch (err) {
                logger.error("ReceiptApplicationForm", "Failed to fetch invoices", err);
            } finally {
                setFetching(false);
            }
        };
        if (data.client) fetchInvoices();
    }, [data.client]);

    const handleManualAllocation = (invoiceId, amount, balanceDue) => {
        const numAmt = Number(amount || 0);
        const clampedAmt = Math.min(numAmt, balanceDue);

        const newAllocations = { ...allocations, [invoiceId]: clampedAmt };
        if (clampedAmt <= 0) delete newAllocations[invoiceId];

        const totalApplied = Object.values(newAllocations).reduce((sum, a) => sum + a, 0);
        if (totalApplied > data.total_amount) {
            alert("Total applied amount cannot exceed receipt total");
            return;
        }

        setAllocations(newAllocations);
        setAvailableAmount(data.total_amount - totalApplied);
    };

    const handleAutoApply = () => {
        let remaining = data.total_amount;
        const newAllocs = {};
        for (const inv of invoices) {
            if (remaining <= 0) break;
            const toApply = Math.min(remaining, inv.balance_due);
            if (toApply > 0) {
                newAllocs[inv._id] = toApply;
                remaining -= toApply;
            }
        }
        setAllocations(newAllocs);
        setAvailableAmount(remaining);
    };

    const handleFinalSubmit = () => {
        const allocArray = Object.entries(allocations).map(([invoiceId, amount]) => ({
            invoiceId,
            amount
        }));
        onSubmit(allocArray);
    };

    if (fetching) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <Spinner />
        </div>
    );

    return (
        <div className="step-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 className="form-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Apply to Invoices</h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Allocate the received funds to outstanding invoices.</p>
                </div>
                <button
                    type="button"
                    onClick={handleAutoApply}
                    className="auto-apply-smart-btn"
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
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <FiZap size={13} style={{ fill: invoices.length === 0 ? 'transparent' : 'rgba(255,255,255,0.2)' }} /> Auto Apply
                </button>
            </div>

            <div style={{
                background: 'white',
                padding: '32px',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                marginBottom: '32px'
            }}>
                <div style={{
                    padding: '20px 24px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    marginBottom: '32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Applyable</span>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>₹{data.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remaining</span>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: availableAmount < 0 ? '#ef4444' : '#7c3aed' }}>₹{availableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {invoices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
                        <FiAlertCircle style={{ color: '#94a3b8', fontSize: '32px', marginBottom: '16px' }} />
                        <p style={{ color: '#64748b', fontWeight: 500 }}>No unpaid invoices found for this client.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {invoices.map(inv => (
                            <div key={inv._id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                                        <FiFileText size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{inv.invoice_no}</div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Balance Due: <strong>₹{inv.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                                    </div>
                                </div>
                                <div style={{ width: '180px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>₹</div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={allocations[inv._id] || ""}
                                        onChange={(e) => handleManualAllocation(inv._id, e.target.value, inv.balance_due)}
                                        style={{ width: '100%', padding: '12px 12px 12px 28px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 600, outline: 'none' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="wizard-footer">
                <button type="button" className="back-btn" onClick={onBack}>
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="next-button"
                    style={{ position: 'static' }}
                    disabled={loading}
                >
                    {loading ? <Spinner size="14" /> : "Complete & Save Receipt"}
                </button>
            </div>
        </div>
    );
};

export default ReceiptApplicationForm;
