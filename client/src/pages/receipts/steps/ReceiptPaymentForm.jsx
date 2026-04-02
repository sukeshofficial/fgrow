import React, { useState, useEffect } from "react";
import { FiCreditCard, FiDollarSign, FiCalendar, FiPlus, FiHash } from "react-icons/fi";

const ReceiptPaymentForm = ({ data, onNext, onPrev }) => {
    const [localData, setLocalData] = useState({
        payments: data.payments || [{ amount: 0, date: new Date().toISOString().slice(0, 10), payment_mode: "Bank Transfer", reference: "", note: "" }],
        tds_amount: data.tds_amount || 0,
        discount: data.discount || 0,
        round_off: data.round_off || 0
    });

    useEffect(() => {
        if (data && data.payments) {
            setLocalData({
                payments: data.payments,
                tds_amount: data.tds_amount || 0,
                discount: data.discount || 0,
                round_off: data.round_off || 0
            });
        }
    }, [data.payments, data.tds_amount, data.discount, data.round_off]);

    const [totalApplyable, setTotalApplyable] = useState(0);

    useEffect(() => {
        const received = localData.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const total = received - Number(localData.tds_amount) - Number(localData.discount) + Number(localData.round_off);
        setTotalApplyable(total);
    }, [localData]);

    const handlePaymentChange = (index, field, value) => {
        const newPayments = [...localData.payments];
        newPayments[index][field] = value;
        setLocalData({ ...localData, payments: newPayments });
    };

    const addPayment = () => {
        setLocalData({
            ...localData,
            payments: [...localData.payments, { amount: 0, date: new Date().toISOString().slice(0, 10), payment_mode: "Bank Transfer", reference: "", note: "" }]
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext({ ...localData, total_amount: totalApplyable });
    };

    return (
        <div className="step-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 className="form-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Payment Details</h2>
                <p style={{ color: '#64748b', fontSize: '14px' }}>Record the actual funds received and any adjustments.</p>
            </div>

            <form onSubmit={handleSubmit} className="premium-form-layout">
                <div style={{
                    background: 'white',
                    padding: '32px',
                    borderRadius: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    marginBottom: '32px'
                }}>
                    {localData.payments.map((payment, index) => (
                        <div key={index} style={{
                            marginBottom: index === localData.payments.length - 1 ? '0' : '32px',
                            paddingBottom: index === localData.payments.length - 1 ? '0' : '32px',
                            borderBottom: index === localData.payments.length - 1 ? 'none' : '1px dashed #e2e8f0'
                        }}>
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div className="form-field-wrapper">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <FiDollarSign style={{ color: '#7c3aed' }} />
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Amount Received</label>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={payment.amount}
                                        onChange={(e) => handlePaymentChange(index, "amount", e.target.value)}
                                        required
                                        className="form-input"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="form-field-wrapper">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <FiCreditCard style={{ color: '#7c3aed' }} />
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Payment Mode</label>
                                    </div>
                                    <select
                                        value={payment.payment_mode}
                                        onChange={(e) => handlePaymentChange(index, "payment_mode", e.target.value)}
                                        required
                                        className="form-input"
                                    >
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Online">Online</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-field-wrapper" style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <FiHash style={{ color: '#7c3aed' }} />
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Reference No.</label>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="TXN ID / Cheque No / UTR"
                                        value={payment.reference}
                                        onChange={(e) => handlePaymentChange(index, "reference", e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
                        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                            <div className="form-field-wrapper">
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'block' }}>TDS (-)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={localData.tds_amount}
                                    onChange={(e) => setLocalData({ ...localData, tds_amount: e.target.value })}
                                    className="form-input"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-field-wrapper">
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'block' }}>Discount (-)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={localData.discount}
                                    onChange={(e) => setLocalData({ ...localData, discount: e.target.value })}
                                    className="form-input"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-field-wrapper">
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'block' }}>Round Off (+/-)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={localData.round_off}
                                    onChange={(e) => setLocalData({ ...localData, round_off: e.target.value })}
                                    className="form-input"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{
                        marginTop: '32px',
                        padding: '24px',
                        background: '#f8fafc',
                        borderRadius: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Total Applyable Amount</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed' }}>
                            ₹{totalApplyable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <div className="wizard-footer">
                    <button type="button" className="back-btn" onClick={onPrev}>
                        Back
                    </button>
                    <button type="submit" className="next-button" style={{ position: 'static' }}>
                        Next: Apply to Invoices
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReceiptPaymentForm;
