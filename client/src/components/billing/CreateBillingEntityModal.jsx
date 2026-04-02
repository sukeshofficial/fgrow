import React, { useState } from "react";
import { FiX, FiHome, FiHash, FiMapPin } from "react-icons/fi";
import { createBillingEntity } from "../../api/billingEntity.api";
import { Spinner } from "../ui/Spinner";
import logger from "../../utils/logger";

const CreateBillingEntityModal = ({ isOpen, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        name: "",
        gstin: "",
        address: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const resp = await createBillingEntity(form);
            if (resp.data.success) {
                onSuccess(resp.data.data);
                onClose();
            } else {
                setError(resp.data.message || "Failed to create entity");
            }
        } catch (err) {
            logger.error("CreateBillingEntityModal", "Failed to create", err);
            setError(err.response?.data?.message || err.message || "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999, padding: '20px'
        }}>
            <div className="modal-content" style={{
                background: 'white',
                width: '100%',
                maxWidth: '500px',
                borderRadius: '24px',
                padding: '32px',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '24px', right: '24px',
                    background: '#f1f5f9', border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#64748b'
                }}>
                    <FiX size={18} />
                </button>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Add Billing Entity</h3>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Create a new company profile for billing.</p>
                </div>

                {error && (
                    <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', border: '1px solid #fee2e2' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FiHome size={14} style={{ color: '#7c3aed' }} />
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Entity Name *</label>
                            </div>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="form-input"
                                placeholder="e.g. Acme Corp India"
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                            />
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FiHash size={14} style={{ color: '#7c3aed' }} />
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>GSTIN (Optional)</label>
                            </div>
                            <input
                                type="text"
                                value={form.gstin}
                                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                                className="form-input"
                                placeholder="27XXXXX0000X0Z0"
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                            />
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FiMapPin size={14} style={{ color: '#7c3aed' }} />
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Registered Address</label>
                            </div>
                            <textarea
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="form-input"
                                placeholder="Building No, Street, City, ZIP..."
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', height: '80px', resize: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={onClose} style={{
                            flex: 1, padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, cursor: 'pointer'
                        }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} style={{
                            flex: 2, padding: '12px', borderRadius: '12px', background: '#7c3aed', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {submitting ? <Spinner size="18" /> : "Create Entity"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBillingEntityModal;
