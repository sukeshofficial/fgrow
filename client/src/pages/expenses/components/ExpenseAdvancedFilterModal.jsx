import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { listClients } from "../../../api/client.api";
import * as expenseApi from "../../../api/expense.api";
import { X, Filter, Calendar, User, Tag, CreditCard, Activity } from "lucide-react";
import "../../../styles/AdvancedFilters.css";

const ExpenseAdvancedFilterModal = ({ isOpen, onClose, filters, onApply, onClear }) => {
    const [localFilters, setLocalFilters] = useState(filters);
    const [clients, setClients] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentModes, setPaymentModes] = useState([]);
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
            const [clientResp, catResp, pmResp] = await Promise.all([
                listClients({ limit: 100 }),
                expenseApi.listExpenseCategories(),
                expenseApi.listPaymentModes()
            ]);
            setClients(clientResp.data.data || []);
            setCategories(catResp.data.data || []);
            setPaymentModes(pmResp.data.data || []);
        } catch (e) {
            console.error("Failed to fetch filter options:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const billingStatusOptions = [
        { _id: 'unbilled', name: 'Unbilled' },
        { _id: 'billed', name: 'Billed' },
        { _id: 'partially_billed', name: 'Partially Billed' }
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
                                    placeholder="From"
                                />
                                <input
                                    type="date"
                                    className="filter-input-styled"
                                    value={localFilters.date_to || ""}
                                    onChange={(e) => setLocalFilters({ ...localFilters, date_to: e.target.value })}
                                    placeholder="To"
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Category */}
                            <div className="filter-field-group">
                                <label className="filter-field-label"><Tag size={12} style={{ marginRight: '4px' }} /> Category</label>
                                <SearchableDropdown
                                    options={categories}
                                    value={localFilters.category}
                                    onChange={(val) => setLocalFilters({ ...localFilters, category: val })}
                                    placeholder="Select Category"
                                    loading={loading}
                                />
                            </div>

                            {/* Payment Mode */}
                            <div className="filter-field-group">
                                <label className="filter-field-label"><CreditCard size={12} style={{ marginRight: '4px' }} /> Payment Mode</label>
                                <SearchableDropdown
                                    options={paymentModes}
                                    value={localFilters.payment_mode}
                                    onChange={(val) => setLocalFilters({ ...localFilters, payment_mode: val })}
                                    placeholder="Select Mode"
                                    loading={loading}
                                />
                            </div>
                        </div>

                        <div className="filter-field-group">
                            <label className="filter-field-label"><Activity size={12} style={{ marginRight: '4px' }} /> Billing Status</label>
                            <SearchableDropdown
                                options={billingStatusOptions}
                                value={localFilters.billing_status}
                                onChange={(val) => setLocalFilters({ ...localFilters, billing_status: val })}
                                placeholder="Select Billing Status"
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

export default ExpenseAdvancedFilterModal;
