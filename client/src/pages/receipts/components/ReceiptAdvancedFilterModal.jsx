import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { listClients, listBillingEntities } from "../../../api/client.api";
import { X, Filter, Calendar, User, Activity } from "lucide-react";
import "../../../styles/AdvancedFilters.css";

const ReceiptAdvancedFilterModal = ({ isOpen, onClose, filters, onApply, onClear }) => {
    const [localFilters, setLocalFilters] = useState(filters);
    const [clients, setClients] = useState([]);
    const [billingEntities, setBillingEntities] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchData();
            setLocalFilters(filters);
        }
    }, [isOpen, filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clientResp, entityResp] = await Promise.all([
                listClients({ limit: 100 }),
                listBillingEntities()
            ]);
            setClients(clientResp.data.data || []);
            setBillingEntities(entityResp.data.data || []);
        } catch (e) {
            console.error("Failed to fetch filter options:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const statusOptions = [
        { _id: 'all', name: 'All Statuses' },
        { _id: 'draft', name: 'Draft' },
        { _id: 'partially_settled', name: 'Partially Settled' },
        { _id: 'settled', name: 'Settled' }
    ];

    return (
        <div className="filter-modal-overlay">
            <div className="filter-modal-container">
                <div className="filter-modal-header">
                    <h3><Filter size={20} /> Advanced Filters</h3>
                    <button className="filter-close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="filter-modal-body">
                    <div className="filter-grid-layout">
                        {/* Date Range */}
                        <div className="filter-field-group">
                            <label className="filter-field-label"><Calendar size={12} style={{ marginRight: '4px' }} /> Date Range</label>
                            <div className="filter-date-row">
                                <input
                                    type="date"
                                    className="filter-input-styled"
                                    value={localFilters.date_from || ""}
                                    onChange={(e) => setLocalFilters({ ...localFilters, date_from: e.target.value })}
                                />
                                <input
                                    type="date"
                                    className="filter-input-styled"
                                    value={localFilters.date_to || ""}
                                    onChange={(e) => setLocalFilters({ ...localFilters, date_to: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Client */}
                        <div className="filter-field-group">
                            <label className="filter-field-label"><User size={12} style={{ marginRight: '4px' }} /> Client</label>
                            <SearchableDropdown
                                options={clients}
                                value={localFilters.client}
                                onChange={(val) => setLocalFilters({ ...localFilters, client: val })}
                                placeholder="Select Client"
                                loading={loading}
                            />
                        </div>

                        {/* Billing Entity */}
                        <div className="filter-field-group">
                            <label className="filter-field-label"><User size={12} style={{ marginRight: '4px' }} /> Billing Entity</label>
                            <SearchableDropdown
                                options={billingEntities}
                                value={localFilters.billing_entity}
                                onChange={(val) => setLocalFilters({ ...localFilters, billing_entity: val })}
                                placeholder="Select Billing Entity"
                                loading={loading}
                            />
                        </div>

                        {/* Status */}
                        <div className="filter-field-group">
                            <label className="filter-field-label"><Activity size={12} style={{ marginRight: '4px' }} /> Status</label>
                            <SearchableDropdown
                                options={statusOptions}
                                value={localFilters.status}
                                onChange={(val) => setLocalFilters({ ...localFilters, status: val })}
                                placeholder="Select Status"
                            />
                        </div>
                    </div>
                </div>

                <div className="filter-modal-footer">
                    <button className="filter-clear-all" onClick={() => { onClear(); onClose(); }}>Reset Filters</button>
                    <div className="filter-footer-btns">
                        <button className="filter-btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="filter-btn-primary" onClick={() => { onApply(localFilters); onClose(); }}>Apply Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptAdvancedFilterModal;
