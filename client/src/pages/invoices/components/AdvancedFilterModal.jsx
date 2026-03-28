import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import FormField from "../../../components/ui/FormField";
import { listClients } from "../../../api/client.api";
import { listBillingEntities } from "../../../api/billingEntity.api";
import { FiX, FiFilter } from "react-icons/fi";
import "../../../styles/AdvancedFilters.css";

const AdvancedFilterModal = ({ isOpen, onClose, filters, onApply, onClear }) => {
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
                listClients({ is_active: true, limit: 100 }),
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

    return (
        <div className="filter-modal-overlay">
            <div className="filter-modal-container">
                <div className="filter-modal-header">
                    <h3><FiFilter /> Advanced Filters</h3>
                    <button className="filter-close-btn" onClick={onClose}><FiX /></button>
                </div>

                <div className="filter-modal-body">
                    <div className="filter-grid-layout">
                        <div className="filter-date-row">
                            <div className="filter-field-group">
                                <label className="filter-field-label">Date From</label>
                                <input
                                    type="date"
                                    className="filter-input-styled"
                                    value={localFilters.date_from || ""}
                                    onChange={(e) => setLocalFilters({ ...localFilters, date_from: e.target.value })}
                                />
                            </div>
                            <div className="filter-field-group">
                                <label className="filter-field-label">Date To</label>
                                <input
                                    type="date"
                                    className="filter-input-styled"
                                    value={localFilters.date_to || ""}
                                    onChange={(e) => setLocalFilters({ ...localFilters, date_to: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="filter-field-group">
                            <label className="filter-field-label">Client</label>
                            <SearchableDropdown
                                options={clients}
                                value={localFilters.client}
                                onChange={(val) => setLocalFilters({ ...localFilters, client: val })}
                                placeholder="Select Client"
                                loading={loading}
                            />
                        </div>

                        <div className="filter-field-group">
                            <label className="filter-field-label">Billing Entity</label>
                            <SearchableDropdown
                                options={billingEntities}
                                value={localFilters.billing_entity}
                                onChange={(val) => setLocalFilters({ ...localFilters, billing_entity: val })}
                                placeholder="Select Billing Entity"
                                loading={loading}
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

export default AdvancedFilterModal;
