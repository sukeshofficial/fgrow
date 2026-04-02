import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import CreateBillingEntityModal from "../../../components/billing/CreateBillingEntityModal";
import { listClientsByTenantId } from "../../../api/client.api";
import { listBillingEntities } from "../../../api/billingEntity.api";
import { useAuth } from "../../../hooks/useAuth";
import { FiUser, FiHome, FiCalendar, FiMessageSquare } from "react-icons/fi";
import logger from "../../../utils/logger";

const ReceiptBasicInfoForm = ({ data, onNext, onPrev, isEdit = false }) => {
    const { tenant } = useAuth();
    const [clients, setClients] = useState([]);
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [localData, setLocalData] = useState({
        client: data.client || "",
        billing_entity: data.billing_entity || "",
        date: data.date || new Date().toISOString().slice(0, 10),
        remark: data.remark || ""
    });

    // Handle initial data population when it arrives via async fetch in Edit mode
    useEffect(() => {
        if (data && isEdit) {
            setLocalData({
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
                                onChange={(e) => setLocalData({ ...localData, date: e.target.value })}
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
    );
};

export default ReceiptBasicInfoForm;
