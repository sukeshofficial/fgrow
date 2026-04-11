import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import quotationService from "../../features/quotations/quotationService";
import * as clientApi from "../../api/client.api";
import * as serviceApi from "../../api/service.api";
import * as billingEntityApi from "../../api/billingEntity.api";
import { Spinner } from "../../components/ui/Spinner";
import { useModal } from "../../context/ModalContext";
import SearchableDropdown from "../../components/ui/SearchableDropdown";
import logger from "../../utils/logger";
import { FiSave, FiX, FiPlus, FiTrash2, FiInfo, FiFileText, FiRefreshCcw, FiHash } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import "./quotations.css";

const QuotationForm = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const { tenant } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [billingEntities, setBillingEntities] = useState([]);

    const [formData, setFormData] = useState({
        quotation_no: "",
        client: "",
        billing_entity: "",
        date: new Date().toISOString().split('T')[0],
        valid_until: "",
        items: [],
        terms: "",
        subtotal: 0,
        total_gst: 0,
        total_amount: 0
    });

    const [resetModal, setResetModal] = useState({ open: false, value: "" });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, servicesRes, entitiesRes] = await Promise.all([
                    clientApi.listClients(),
                    serviceApi.listServices(),
                    billingEntityApi.listBillingEntities()
                ]);
                setClients(clientsRes.data.data || []);
                setServices(servicesRes.data.data || []);
                setBillingEntities(entitiesRes.data.data || []);

                if (isEdit) {
                    const qRes = await quotationService.getQuotation(id);
                    const q = qRes.data;
                    setFormData({
                        ...q,
                        client: q.client?._id || q.client,
                        billing_entity: q.billing_entity?._id || q.billing_entity,
                        date: new Date(q.date).toISOString().split('T')[0],
                        valid_until: q.valid_until ? new Date(q.valid_until).toISOString().split('T')[0] : "",
                        items: q.items || []
                    });
                } else {
                    // Pre-fill next quotation number for new quotations
                    try {
                        const numRes = await quotationService.getNextNumber();
                        if (numRes.success) {
                            setFormData(prev => ({ ...prev, quotation_no: numRes.quotation_no }));
                        }
                    } catch (e) {
                        logger.error("QuotationForm", "Failed to fetch next number", e);
                    }

                    // Default billing entity to current tenant if not already set
                    if (tenant) {
                        // Priority 1: Match entity by name (if BillingEntity collection still used for some reason)
                        const fetchedEntities = entitiesRes.data.data;
                        const match = fetchedEntities.find(
                            e => e.name.toLowerCase().includes(tenant.name.toLowerCase())
                        );

                        // Priority 2: Use Tenant ID directly (as per the new model alignment)
                        setFormData(prev => ({
                            ...prev,
                            billing_entity: match?._id || tenant._id
                        }));
                    }
                }
            } catch (err) {
                logger.error("QuotationForm", "Data fetch failed", err);
                showAlert("Error", "Failed to load form data.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEdit]);

    const calculateTotals = (items) => {
        const subtotal = items.reduce((sum, item) => sum + (Number(item.unit_price || 0) * Number(item.quantity || 1)), 0);
        const total_gst = items.reduce((sum, item) => sum + (Number(item.total_amount || 0) * (Number(item.gst_rate || 0) / 100)), 0); // Simplified
        // Actually total_amount in item already includes GST in the backend often, but let's check item schema.
        // In my PDF logic: item.total_amount = unit_price * quantity. Total = unit_price * quantity * (1 + gst/100)
        // Let's stick to unit_price * quantity for subtotal.
        const total = items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
        setFormData(prev => ({ ...prev, subtotal, total_gst: total - subtotal, total_amount: total }));
    };

    const addItem = () => {
        const newItem = { description: "", quantity: 1, unit_price: 0, gst_rate: 18, total_amount: 0 };
        const updatedItems = [...formData.items, newItem];
        setFormData({ ...formData, items: updatedItems });
    };

    const removeItem = (index) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: updatedItems });
        calculateTotals(updatedItems);
    };

    const updateItem = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;

        // Auto-calc total for this item
        const qty = Number(updatedItems[index].quantity || 0);
        const price = Number(updatedItems[index].unit_price || 0);
        const gst = Number(updatedItems[index].gst_rate || 0);
        updatedItems[index].total_amount = qty * price * (1 + gst / 100);

        setFormData({ ...formData, items: updatedItems });
        calculateTotals(updatedItems);
    };

    const handleServiceSelect = (index, serviceId) => {
        const service = services.find(s => s._id === serviceId);
        if (service) {
            updateItem(index, 'description', service.name);
            updateItem(index, 'unit_price', service.basePrice || 0);
            updateItem(index, 'gst_rate', service.gstRate || 18);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (isEdit) {
                await quotationService.updateQuotation(id, formData);
                showAlert("Updated", "Quotation updated successfully", "success");
            } else {
                const res = await quotationService.createQuotation(formData);
                showAlert("Created", "Quotation created successfully", "success");
                navigate(`/finance/quotations/${res.data._id}`);
                return;
            }
            navigate(`/finance/quotations/${id}`);
        } catch (err) {
            logger.error("QuotationForm", "Save failed", err);
            showAlert("Error", "Failed to save quotation.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;

    return (
        <>
            <Sidebar />
            <div className="clients">
                <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{isEdit ? 'Edit Quotation' : 'Create New Quotation'}</h1>
                            <p style={{ color: '#64748b' }}>Fill in the details to generate a professional quotation.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="action-btn-styled" onClick={() => navigate(-1)} disabled={saving}>
                                <FiX /> Cancel
                            </button>
                            <button
                                className="action-btn-styled"
                                style={{ background: '#7c3aed', color: 'white', border: 'none' }}
                                onClick={handleSubmit}
                                disabled={saving}
                            >
                                {saving ? '' : <FiSave />} {isEdit ? 'Update' : 'Save'} Quotation
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '30px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '8px' }}>
                                        <FiFileText style={{ color: '#7c3aed' }} /> Select Client
                                    </label>
                                    <SearchableDropdown
                                        options={clients}
                                        value={formData.client}
                                        onChange={(val) => setFormData({ ...formData, client: val })}
                                        placeholder="Select Client"
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: '8px' }}>
                                        <FiInfo style={{ color: '#7c3aed' }} /> Billing Entity
                                    </label>
                                    <SearchableDropdown
                                        options={billingEntities}
                                        value={formData.billing_entity}
                                        onChange={(val) => setFormData({ ...formData, billing_entity: val })}
                                        placeholder="Select Billing Entity"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Line Items</h3>
                                    <button
                                        type="button"
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                        onClick={addItem}
                                    >
                                        <FiPlus /> Add Item
                                    </button>
                                </div>

                                <div style={{ border: '1px solid #f1f5f9', borderRadius: '16px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>SERVICE/DESC</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#94a3b8', width: '80px' }}>QTY</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#94a3b8', width: '120px' }}>PRICE</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#94a3b8', width: '80px' }}>GST%</th>
                                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: '#94a3b8', width: '120px' }}>TOTAL</th>
                                                <th style={{ padding: '12px', width: '50px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.items.map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <SearchableDropdown
                                                            options={services}
                                                            onChange={(val) => handleServiceSelect(idx, val)}
                                                            placeholder="Choose Service (Optional)"
                                                        />
                                                        <textarea
                                                            placeholder="Item description..."
                                                            style={{ width: '100%', padding: '8px', border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: '13px', resize: 'vertical' }}
                                                            value={item.description}
                                                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <input
                                                            type="number"
                                                            style={{ width: '100%', padding: '8px', border: '1px solid #f1f5f9', borderRadius: '8px' }}
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <input
                                                            type="number"
                                                            style={{ width: '100%', padding: '8px', border: '1px solid #f1f5f9', borderRadius: '8px' }}
                                                            value={item.unit_price}
                                                            onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <input
                                                            type="number"
                                                            style={{ width: '100%', padding: '8px', border: '1px solid #f1f5f9', borderRadius: '8px' }}
                                                            value={item.gst_rate}
                                                            onChange={(e) => updateItem(idx, 'gst_rate', e.target.value)}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                                                        ₹{item.total_amount?.toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <button
                                                            type="button"
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                            onClick={() => removeItem(idx)}
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {formData.items.length === 0 && (
                                                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Click "Add Item" to begin.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px' }}>
                                <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.05em' }}>Quotation Settings</h3>

                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', textTransform: 'uppercase' }}>
                                        <FiHash style={{ color: '#7c3aed' }} /> QUOTATION NO
                                        <div style={{ flex: 1 }}></div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentSeq = (formData.quotation_no && typeof formData.quotation_no === 'string') ? formData.quotation_no.split('/').pop() : "001";
                                                setResetModal({ open: true, value: currentSeq });
                                            }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px',
                                                fontSize: '10px', fontWeight: 600, textTransform: 'capitalize'
                                            }}
                                            title="Reset sequence counter"
                                        >
                                            <FiRefreshCcw size={10} /> Reset
                                        </button>
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                        <div style={{
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRight: 'none',
                                            padding: '0 12px',
                                            borderRadius: '12px 0 0 12px',
                                            color: '#64748b',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            fontFamily: 'Space Mono, monospace',
                                            display: 'flex',
                                            alignItems: 'center',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {(() => {
                                                const d = new Date(formData.date);
                                                const y = d.getMonth() >= 3 ? d.getFullYear() % 100 : (d.getFullYear() - 1) % 100;
                                                return `QUO/${y}-${y + 1}/`;
                                            })()}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="001"
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '0 12px 12px 0',
                                                border: '1px solid #e2e8f0',
                                                fontFamily: 'Space Mono, monospace'
                                            }}
                                            value={(formData.quotation_no && typeof formData.quotation_no === 'string') ? formData.quotation_no.split('/').pop() : ""}
                                            onChange={(e) => {
                                                const seq = e.target.value;
                                                const d = new Date(formData.date);
                                                const y = d.getMonth() >= 3 ? d.getFullYear() % 100 : (d.getFullYear() - 1) % 100;
                                                setFormData({ ...formData, quotation_no: `QUO/${y}-${y + 1}/${seq}` });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', textTransform: 'uppercase' }}>
                                        <FiInfo style={{ color: '#7c3aed' }} /> DATE
                                    </label>
                                    <input
                                        type="date"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', textTransform: 'uppercase' }}>
                                        <FiInfo style={{ color: '#7c3aed' }} /> VALID UNTIL
                                    </label>
                                    <input
                                        type="date"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', borderRadius: '20px', border: '1px dashed #cbd5e1', padding: '24px' }}>
                                <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '20px' }}>Summary</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#64748b' }}>
                                    <span>Subtotal</span>
                                    <span>₹{formData.subtotal?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#64748b' }}>
                                    <span>GST Total</span>
                                    <span>₹{formData.total_gst?.toLocaleString()}</span>
                                </div>
                                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 900, color: '#7c3aed' }}>
                                    <span>TOTAL</span>
                                    <span>₹{formData.total_amount?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                                    <FiInfo /> Terms & Conditions
                                </div>
                                <textarea
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', minHeight: '100px' }}
                                    placeholder="Enter payment terms, validity notes..."
                                    value={formData.terms}
                                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Counter Modal */}
            {resetModal.open && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(15,23,42,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '24px',
                        padding: '32px', width: '380px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Reset Quotation Counter</h3>
                            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
                                The next quotation will use this sequence number.
                            </p>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Next Sequence Number</label>
                            <input
                                type="number"
                                min="1"
                                autoFocus
                                value={resetModal.value}
                                onChange={e => setResetModal(prev => ({ ...prev, value: e.target.value }))}
                                style={{
                                    width: '100%', padding: '16px', border: '2px solid #7c3aed',
                                    borderRadius: '16px', fontSize: '24px', fontFamily: 'Space Mono, monospace',
                                    fontWeight: 700, color: '#1e293b', outline: 'none', boxSizing: 'border-box',
                                    textAlign: 'center'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setResetModal({ open: false, value: "" })}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '14px',
                                    border: '1px solid #e2e8f0', background: '#f8fafc',
                                    color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '14px'
                                }}
                            >Cancel</button>
                            <button
                                onClick={async () => {
                                    const newSeq = parseInt(resetModal.value, 10);
                                    if (isNaN(newSeq) || newSeq < 1) return;
                                    try {
                                        const d = new Date(formData.date);
                                        const fy = d.getMonth() >= 3 ? d.getFullYear() % 100 : (d.getFullYear() - 1) % 100;
                                        const res = await quotationService.resetCounter(newSeq, String(fy));
                                        if (res.success) {
                                            setFormData(prev => ({ ...prev, quotation_no: res.quotation_no }));
                                            showAlert("Success", "Counter reset successfully", "success");
                                        }
                                    } catch (err) {
                                        logger.error("QuotationForm", "reset failed", err);
                                        showAlert("Error", "Failed to reset counter", "error");
                                    }
                                    setResetModal({ open: false, value: "" });
                                }}
                                style={{
                                    flex: 1.5, padding: '12px', borderRadius: '14px',
                                    border: 'none', background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                                    color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
                                }}
                            >Save Counter</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuotationForm;
