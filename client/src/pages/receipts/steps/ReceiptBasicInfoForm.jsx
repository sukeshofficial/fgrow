import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import CreateBillingEntityModal from "../../../components/billing/CreateBillingEntityModal";
import { listClientsByTenantId } from "../../../api/client.api";
import { listBillingEntities } from "../../../api/billingEntity.api";
import { useAuth } from "../../../hooks/useAuth";
import { FiUser, FiHome, FiCalendar, FiMessageSquare, FiHash, FiRefreshCcw } from "react-icons/fi";
import logger from "../../../utils/logger";
import receiptService from "../../../features/receipts/receiptService";

const ReceiptBasicInfoForm = ({ data, onNext, onPrev, isEdit = false }) => {
    const { tenant } = useAuth();
    const [clients, setClients] = useState([]);
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resetModal, setResetModal] = useState({ open: false, value: "" });

    const [localData, setLocalData] = useState({
        receipt_no: data.receipt_no || "",
        client: data.client || "",
        billing_entity: data.billing_entity || "",
        date: data.date || new Date().toISOString().slice(0, 10),
        remark: data.remark || ""
    });

    // Handle initial data population when it arrives via async fetch in Edit mode
    useEffect(() => {
        if (data && isEdit) {
            setLocalData({
                receipt_no: data.receipt_no || "",
                client: data.client || "",
                billing_entity: data.billing_entity || "",
                date: data.date || "",
                remark: data.remark || ""
            });
        }
    }, [data, isEdit]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clientsResp, entitiesResp] = await Promise.all([
                listClientsByTenantId({ limit: 1000 }),
                listBillingEntities()
            ]);

            const fetchedEntities = entitiesResp.data.data || [];
            setClients(clientsResp.data.data || []);
            setEntities(fetchedEntities);

            // Default billing entity to current tenant if not already set
            if (!localData.billing_entity && tenant && fetchedEntities.length > 0) {
                const defaultEntity = fetchedEntities.find(
                    e => e.name.toLowerCase().includes(tenant.name.toLowerCase())
                ) || fetchedEntities[0];

                if (defaultEntity) {
                    setLocalData(prev => ({ ...prev, billing_entity: defaultEntity._id }));
                }
            }
        } catch (err) {
            logger.error("ReceiptBasicInfoForm", "Failed to fetch clients/entities", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleNewEntitySuccess = (newEntity) => {
        setEntities(prev => [...prev, newEntity]);
        setLocalData(prev => ({ ...prev, billing_entity: newEntity._id }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext(localData);
    };

    return (
        <>
            <div className="step-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h2 className="form-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Basic Information</h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Select the client, billing entity, and date for this receipt.</p>
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
                        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <FiHash style={{ color: '#7c3aed' }} />
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Receipt Number (Optional)</label>
                                    <div style={{ flex: 1 }}></div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentSeq = (localData.receipt_no && typeof localData.receipt_no === 'string') ? localData.receipt_no.split('/').pop() : "0001";
                                            setResetModal({ open: true, value: currentSeq });
                                        }}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px',
                                            fontSize: '12px', fontWeight: 600
                                        }}
                                        title="Auto-generate next sequence"
                                    >
                                        <FiRefreshCcw size={12} /> Reset
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
                                    <div style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRight: 'none',
                                        padding: '12px 16px',
                                        borderRadius: '12px 0 0 12px',
                                        color: '#64748b',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        fontFamily: 'Space Mono, monospace',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        {(() => {
                                            const d = new Date(localData.date || new Date());
                                            const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
                                            return `RCPT/${y % 100}-${(y + 1) % 100}/`;
                                        })()}
                                    </div>
                                    <input
                                        type="text"
                                        name="receipt_no_seq"
                                        className="form-input"
                                        style={{
                                            borderRadius: '0 12px 12px 0',
                                            fontFamily: 'Space Mono, monospace',
                                            flex: 1,
                                            width: 'auto',
                                            margin: 0
                                        }}
                                        value={(localData.receipt_no && typeof localData.receipt_no === 'string') ? localData.receipt_no.split('/').pop() : ""}
                                        onChange={(e) => {
                                            const seq = e.target.value;
                                            const d = new Date(localData.date || new Date());
                                            const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
                                            const fyStr = `${y % 100}-${(y + 1) % 100}`;
                                            setLocalData(prev => ({
                                                ...prev,
                                                receipt_no: seq ? `RCPT/${fyStr}/${seq}` : ""
                                            }));
                                        }}
                                        placeholder="e.g. 0001 (Auto-generated if blank)"
                                    />
                                </div>
                                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                                    Type only the number part. Formatted as <b>
                                        {(() => {
                                            const d = new Date(localData.date || new Date());
                                            const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
                                            return `RCPT/${y % 100}-${(y + 1) % 100}/XXXX`;
                                        })()}
                                    </b>
                                </p>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <FiUser style={{ color: '#7c3aed' }} />
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Select Client</label>
                                </div>
                                <SearchableDropdown
                                    options={clients}
                                    value={localData.client}
                                    onChange={(val) => setLocalData({ ...localData, client: val })}
                                    placeholder="Search by client name..."
                                    loading={loading}
                                    disabled={isEdit}
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <FiHome style={{ color: '#7c3aed' }} />
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Billing Entity</label>
                                </div>
                                <SearchableDropdown
                                    options={entities}
                                    value={localData.billing_entity}
                                    onChange={(val) => setLocalData({ ...localData, billing_entity: val })}
                                    placeholder="Search by entity name..."
                                    loading={loading}
                                    onAddNew={() => setIsModalOpen(true)}
                                    addNewLabel="Add New Billing Entity"
                                    disabled={isEdit}
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <FiCalendar style={{ color: '#7c3aed' }} />
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Receipt Date</label>
                                </div>
                                <input
                                    type="date"
                                    value={localData.date}
                                    onChange={(e) => {
                                        const newDate = e.target.value;
                                        let updates = { date: newDate };

                                        const oldDate = new Date(localData.date);
                                        const d = new Date(newDate);

                                        const oldMonth = oldDate.getMonth();
                                        const oldCalYear = oldDate.getFullYear();
                                        const oldFy = oldMonth >= 3 ? oldCalYear : oldCalYear - 1;
                                        const oldFyStr = `${oldFy % 100}-${(oldFy + 1) % 100}`;

                                        const newMonth = d.getMonth();
                                        const newCalYear = d.getFullYear();
                                        const newFy = newMonth >= 3 ? newCalYear : newCalYear - 1;
                                        const newFyStr = `${newFy % 100}-${(newFy + 1) % 100}`;

                                        if (oldFyStr !== newFyStr && localData.receipt_no && typeof localData.receipt_no === 'string' && localData.receipt_no.startsWith(`RCPT/${oldFyStr}/`)) {
                                            const seq = localData.receipt_no.split('/').pop();
                                            updates.receipt_no = `RCPT/${newFyStr}/${seq}`;
                                        }

                                        setLocalData(prev => ({ ...prev, ...updates }));
                                    }}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <FiMessageSquare style={{ color: '#7c3aed' }} />
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Remarks / Notes</label>
                                </div>
                                <textarea
                                    value={localData.remark}
                                    onChange={(e) => setLocalData({ ...localData, remark: e.target.value })}
                                    className="form-input"
                                    style={{ height: '100px', paddingTop: '16px' }}
                                    placeholder="Any internal notes or remarks..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="wizard-footer">
                        <button type="button" className="back-btn" onClick={onPrev}>
                            Cancel
                        </button>
                        <button type="submit" className="next-button" style={{ position: 'static' }}>
                            Next: Payment Details
                        </button>
                    </div>
                </form>

                <CreateBillingEntityModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleNewEntitySuccess}
                />
            </div>

            {/* Reset Counter Modal */}
            {
                resetModal.open && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(15,23,42,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{
                            background: '#fff', borderRadius: '20px',
                            padding: '32px', width: '360px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                            display: 'flex', flexDirection: 'column', gap: '20px'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>Reset Receipt Counter</h3>
                                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
                                    The next receipt will use this number. Future receipts will count up from here.
                                </p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>Next sequence number</label>
                                <input
                                    type="number"
                                    min="1"
                                    autoFocus
                                    value={resetModal.value}
                                    onChange={e => setResetModal(prev => ({ ...prev, value: e.target.value }))}
                                    onKeyDown={async e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const newSeq = parseInt(resetModal.value, 10);
                                            if (isNaN(newSeq) || newSeq < 1) return;
                                            try {
                                                const d = new Date(localData.date || new Date());
                                                const fy = d.getMonth() >= 3 ? d.getFullYear() % 100 : (d.getFullYear() - 1) % 100;
                                                const res = await receiptService.resetReceiptCounter(newSeq, String(fy));
                                                const val = res.data || "";
                                                setLocalData(prev => ({ ...prev, receipt_no: typeof val === 'string' ? val : "" }));
                                            } catch (e) { logger.error("ReceiptBasicInfoForm", "reset failed", e); }
                                            setResetModal({ open: false, value: "" });
                                        }
                                        if (e.key === 'Escape') setResetModal({ open: false, value: "" });
                                    }}
                                    style={{
                                        width: '100%', padding: '12px 16px', border: '2px solid #7c3aed',
                                        borderRadius: '12px', fontSize: '20px', fontFamily: 'Space Mono, monospace',
                                        fontWeight: 700, color: '#1e293b', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setResetModal({ open: false, value: "" })}
                                    style={{
                                        padding: '10px 20px', borderRadius: '10px',
                                        border: '1px solid #e2e8f0', background: '#f8fafc',
                                        color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '13px'
                                    }}
                                >Cancel</button>
                                <button
                                    onClick={async () => {
                                        const newSeq = parseInt(resetModal.value, 10);
                                        if (isNaN(newSeq) || newSeq < 1) return;
                                        try {
                                            const d = new Date(localData.date || new Date());
                                            const fy = d.getMonth() >= 3 ? d.getFullYear() % 100 : (d.getFullYear() - 1) % 100;
                                            const res = await receiptService.resetReceiptCounter(newSeq, String(fy));
                                            const val = res.data || "";
                                            setLocalData(prev => ({ ...prev, receipt_no: typeof val === 'string' ? val : "" }));
                                        } catch (err) { logger.error("ReceiptBasicInfoForm", "reset failed", err); }
                                        setResetModal({ open: false, value: "" });
                                    }}
                                    style={{
                                        padding: '10px 20px', borderRadius: '10px',
                                        border: 'none', background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                                        color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                                    }}
                                >Save Counter</button>
                            </div>
                        </div>
                    </div>
                )}
        </>
    );
};

export default ReceiptBasicInfoForm;
