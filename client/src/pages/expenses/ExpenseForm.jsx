import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import * as expenseApi from "../../api/expense.api";
import * as clientApi from "../../api/client.api";
import { Spinner } from "../../components/ui/Spinner";
import { useModal } from "../../context/ModalContext";
import SearchableDropdown from "../../components/ui/SearchableDropdown";
import logger from "../../utils/logger";
import {
    Save,
    X,
    Plus,
    Trash2,
    Info,
    FileText as LucideFileText,
    Hash,
    Paperclip,
    Calendar,
    CreditCard,
    User,
    RotateCcw,
    Eye,
    FileImage,
    Tag,
    CreditCard as CreditCardIcon
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import "./expenses.css";

const ExpenseForm = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    const [clients, setClients] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentModes, setPaymentModes] = useState([]);

    const [resetModal, setResetModal] = useState({ open: false, value: "" });
    const [inputModal, setInputModal] = useState({ open: false, type: "", value: "", label: "" });
    const [previewModal, setPreviewModal] = useState({ open: false, file: null });

    const getFY = (dateStr) => {
        const d = new Date(dateStr);
        const y = d.getMonth() >= 3 ? d.getFullYear() % 100 : (d.getFullYear() - 1) % 100;
        return `${y}-${y + 1}`;
    };

    const [formData, setFormData] = useState({
        expense_no: "",
        client: "",
        category: "",
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        tds_amount: 0,
        discount: 0,
        round_off: 0,
        total_amount: 0,
        payment_mode: "",
        notes: "",
        files: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, catsRes, modesRes] = await Promise.all([
                    clientApi.listClients(),
                    expenseApi.listExpenseCategories(),
                    expenseApi.listPaymentModes()
                ]);
                setClients(clientsRes.data.data || []);
                setCategories(catsRes.data.data || []);
                setPaymentModes(modesRes.data.data || []);

                if (isEdit) {
                    const eRes = await expenseApi.getExpense(id);
                    const e = eRes.data.data;
                    setFormData({
                        ...e,
                        client: e.client?._id || e.client,
                        category: e.category?._id || e.category,
                        payment_mode: e.payment_mode?._id || e.payment_mode,
                        date: new Date(e.date).toISOString().split('T')[0],
                    });
                } else {
                    try {
                        const numRes = await expenseApi.getNextNumber(new Date().toISOString().split('T')[0]);
                        if (numRes.data.success) {
                            setFormData(prev => ({ ...prev, expense_no: numRes.data.expense_no }));
                        }
                    } catch (e) {
                        logger.error("ExpenseForm", "Failed to fetch next number", e);
                    }
                }
            } catch (err) {
                logger.error("ExpenseForm", "Data fetch failed", err);
                showAlert("Error", "Failed to load form data.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEdit]);

    useEffect(() => {
        if (!isEdit && formData.date) {
            const fetchNextNo = async () => {
                try {
                    const numRes = await expenseApi.getNextNumber(formData.date);
                    if (numRes.data.success) {
                        setFormData(prev => ({ ...prev, expense_no: numRes.data.expense_no }));
                    }
                } catch (e) {
                    logger.error("ExpenseForm", "Failed to fetch next number on date change", e);
                }
            };
            fetchNextNo();
        }
    }, [formData.date, isEdit]);

    useEffect(() => {
        // Auto-calculate total amount
        const amount = Number(formData.amount || 0);
        const tds = Number(formData.tds_amount || 0);
        const discount = Number(formData.discount || 0);
        const roundOff = Number(formData.round_off || 0);
        const total = amount - tds - discount + roundOff;
        setFormData(prev => ({ ...prev, total_amount: Math.max(0, total) }));
    }, [formData.amount, formData.tds_amount, formData.discount, formData.round_off]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (isEdit) {
                await expenseApi.updateExpense(id, formData);
                showAlert("Updated", "Expense updated successfully", "success");
            } else {
                const res = await expenseApi.createExpense(formData);
                showAlert("Created", "Expense created successfully", "success");
            }
            navigate("/finance/expenses");
        } catch (err) {
            logger.error("ExpenseForm", "Save failed", err);
            showAlert("Error", err.response?.data?.message || "Failed to save expense.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        if (isEdit) {
            try {
                const uploadData = new FormData();
                selectedFiles.forEach(file => uploadData.append("files", file));
                const res = await expenseApi.uploadExpenseFiles(id, uploadData);
                setFormData(prev => ({ ...prev, files: res.data.data.files }));
                showAlert("Success", "Files uploaded successfully", "success");
            } catch (err) {
                logger.error("ExpenseForm", "File upload failed", err);
                showAlert("Error", err.response?.data?.message || "Failed to upload files.", "error");
            }
        } else {
            showAlert("Info", "Please save the expense first to upload attachments.", "info");
        }
    };

    const handleAddNewCategory = (searchTerm) => {
        setInputModal({
            open: true,
            type: "category",
            value: typeof searchTerm === 'string' ? searchTerm : "",
            label: "Category Name"
        });
    };

    const handleAddNewPaymentMode = (searchTerm) => {
        setInputModal({
            open: true,
            type: "payment_mode",
            value: typeof searchTerm === 'string' ? searchTerm : "",
            label: "Payment Mode Name"
        });
    };

    const handleInputModalSubmit = async () => {
        const { type, value } = inputModal;
        if (!value.trim()) return;

        try {
            if (type === "category") {
                const res = await expenseApi.createExpenseCategory({ name: value });
                setCategories(prev => [...prev, res.data.data]);
                setFormData(prev => ({ ...prev, category: res.data.data._id }));
            } else {
                const res = await expenseApi.createPaymentMode({ name: value });
                setPaymentModes(prev => [...prev, res.data.data]);
                setFormData(prev => ({ ...prev, payment_mode: res.data.data._id }));
            }
            showAlert("Success", "Added successfully", "success");
        } catch (err) {
            showAlert("Error", "Failed to add", "error");
        }
        setInputModal({ open: false, type: "", value: "", label: "" });
    };

    const handleResetCounter = async () => {
        const newSeq = parseInt(resetModal.value, 10);
        if (isNaN(newSeq) || newSeq < 1) return;
        try {
            const fy = getFY(formData.date).split('-')[0];
            const res = await expenseApi.resetCounter(newSeq, fy);
            if (res.data.success) {
                setFormData(prev => ({ ...prev, expense_no: res.data.expense_no }));
                showAlert("Success", "Counter reset successfully", "success");
            }
        } catch (err) {
            logger.error("ExpenseForm", "Reset failed", err);
            showAlert("Error", "Failed to reset counter", "error");
        }
        setResetModal({ open: false, value: "" });
    };

    const getFileIcon = (mime) => {
        if (!mime) return <LucideFileText size={18} />;
        if (mime.startsWith('image/')) return <FileImage size={18} />;
        return <LucideFileText size={18} />;
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;

    return (
        <>
            <Sidebar />
            <div className="finance">
                <div className="expense-list-container">
                    <div className="expense-header" style={{ marginTop: '32px' }}>
                        <div>
                            <h1>{isEdit ? 'Edit Expense' : 'Record New Expense'}</h1>
                            <p style={{ color: '#64748b' }}>Maintain your business spending records with precision.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="toggle-btn"
                                style={{ background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                                onClick={() => navigate(-1)}
                                disabled={saving}
                            >
                                <X size={18} /> Cancel
                            </button>
                            <button
                                className="create-btn"
                                onClick={handleSubmit}
                                disabled={saving}
                            >
                                {saving ? <Spinner size="sm" /> : <Save size={18} />} {isEdit ? 'Update' : 'Save'} Expense
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '30px' }}>
                        {/* Left Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div className="form-card">
                                <div className="form-grid">
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">
                                            <LucideFileText size={16} /> Category
                                        </label>
                                        <SearchableDropdown
                                            options={categories}
                                            value={formData.category}
                                            onChange={(val) => setFormData({ ...formData, category: val })}
                                            placeholder="Select Category"
                                            onAddNew={handleAddNewCategory}
                                            addNewLabel="Add Category"
                                        />
                                    </div>

                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">
                                            <User size={16} /> Client (Optional)
                                        </label>
                                        <SearchableDropdown
                                            options={clients}
                                            value={formData.client}
                                            onChange={(val) => setFormData({ ...formData, client: val })}
                                            placeholder="Select Client"
                                        />
                                    </div>

                                    <div className="form-section">
                                        <h3 className="form-section-title">Description & Notes</h3>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="What was this expense for?"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-section">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Attachments</h3>
                                            <label className="toggle-btn" style={{ cursor: 'pointer', background: 'white', display: 'flex', gap: '6px', alignItems: 'center', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                                                <Paperclip size={16} /> Browse Files
                                                <input type="file" multiple hidden onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        <div className="file-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {formData.files.map((file, idx) => (
                                                <div
                                                    key={idx}
                                                    className="file-card clickable"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setPreviewModal({ open: true, file })}
                                                >
                                                    <div className="file-icon"><LucideFileText size={18} /></div>
                                                    <div className="file-info">
                                                        <div className="file-name">{file.name || "Attachment"}</div>
                                                        <div className="file-meta" style={{ fontSize: '10px', color: '#94a3b8' }}>
                                                            {file.mime?.split('/')[1]?.toUpperCase() || "FILE"} • {(file.size ? (file.size / 1024).toFixed(1) : "0")} KB
                                                        </div>
                                                    </div>
                                                    <Trash2
                                                        size={16}
                                                        className="remove-file"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();

                                                            if (isEdit && file.key) {
                                                                try {
                                                                    await expenseApi.deleteExpenseFile(id, file.key);
                                                                } catch (error) {
                                                                    showAlert("Error", "Failed to delete file from the server.", "error");
                                                                    return;
                                                                }
                                                            }

                                                            const newFiles = [...formData.files];
                                                            newFiles.splice(idx, 1);
                                                            setFormData({ ...formData, files: newFiles });
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                            {formData.files.length === 0 && (
                                                <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '32px', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '16px', background: '#f8fafc' }}>
                                                    No files attached.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div className="settings-card">
                                <h3 className="card-title">Expense Settings</h3>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span><Hash size={14} /> EXPENSE NO</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentSeq = (formData.expense_no && typeof formData.expense_no === 'string') ? formData.expense_no.split('/').pop() : "001";
                                                setResetModal({ open: true, value: currentSeq });
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <RotateCcw size={10} /> Reset
                                        </button>
                                    </label>
                                    <div style={{ display: 'flex' }}>
                                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRight: 'none', padding: '0 12px', borderRadius: '12px 0 0 12px', color: '#64748b', fontSize: '13px', fontWeight: 600, fontFamily: 'Space Mono, monospace', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                            EXP/{getFY(formData.date)}/
                                        </div>
                                        <input
                                            type="text"
                                            className="form-input"
                                            style={{ borderRadius: '0 12px 12px 0', borderLeft: 'none' }}
                                            placeholder="001"
                                            value={(formData.expense_no && typeof formData.expense_no === 'string') ? formData.expense_no.split('/').pop() : ""}
                                            onChange={(e) => {
                                                const seq = e.target.value;
                                                setFormData({ ...formData, expense_no: `EXP/${getFY(formData.date)}/${seq}` });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Calendar size={14} /> DATE
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <CreditCard size={14} /> PAYMENT MODE
                                    </label>
                                    <SearchableDropdown
                                        options={paymentModes}
                                        value={formData.payment_mode}
                                        onChange={(val) => setFormData({ ...formData, payment_mode: val })}
                                        placeholder="Select Mode"
                                        onAddNew={handleAddNewPaymentMode}
                                        addNewLabel="Add Mode"
                                    />
                                </div>
                            </div>

                            <div className="settings-card">
                                <h3 className="card-title">Financial Details</h3>

                                <div className="form-group">
                                    <label className="form-label">BASE AMOUNT</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">TDS</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={formData.tds_amount}
                                            onChange={(e) => setFormData({ ...formData, tds_amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">DISCOUNT</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="table-container financials">
                                    <div className="totals-panel">
                                        <div className="total-row">
                                            <span>Base Amount</span>
                                            <span>₹{Number(formData.amount || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="total-row">
                                            <span>Tax/TDS (-)</span>
                                            <span>₹{Number(formData.tds_amount || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="total-row">
                                            <span>Discount (-)</span>
                                            <span>₹{Number(formData.discount || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="total-row grand-total">
                                            <span>TOTAL</span>
                                            <span>₹{formData.total_amount?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Counter Modal */}
            {resetModal.open && (
                <div className="modal-overlay">
                    <div className="modal-container mini">
                        <div className="modal-header">
                            <h3>Reset Sequence</h3>
                            <button className="close-btn" onClick={() => setResetModal({ open: false, value: "" })}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <label className="form-label">Next Sequence Number</label>
                            <input
                                type="number"
                                className="form-input sequence-input"
                                value={resetModal.value}
                                onChange={e => setResetModal({ ...resetModal, value: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="toggle-btn" onClick={() => setResetModal({ open: false, value: "" })}>Cancel</button>
                            <button className="create-btn" onClick={handleResetCounter}>Save Counter</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Modal (Category/Mode) */}
            {inputModal.open && (
                <div className="modal-overlay">
                    <div className="modal-container mini">
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {inputModal.type === "category" ? <Tag size={18} style={{ color: '#7c3aed' }} /> : <CreditCardIcon size={18} style={{ color: '#7c3aed' }} />}
                                <h3>New {inputModal.type === "category" ? "Category" : "Payment Mode"}</h3>
                            </div>
                            <button onClick={() => setInputModal({ open: false, type: "", value: "", label: "" })} className="close-btn">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-desc">
                                {inputModal.type === "category"
                                    ? "Create a new category to group your expenses (e.g., Travel, Software, Rent)."
                                    : "Add a new method of payment (e.g., Petty Cash, HDFC Credit Card)."}
                            </p>
                            <div className="input-with-icon">
                                {inputModal.type === "category" ? <Tag size={16} /> : <CreditCardIcon size={16} />}
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={inputModal.type === "category" ? "e.g. Office Supplies" : "e.g. Bank Transfer"}
                                    value={inputModal.value}
                                    onChange={e => setInputModal({ ...inputModal, value: e.target.value })}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="toggle-btn" onClick={() => setInputModal({ open: false, type: "", value: "", label: "" })}>Cancel</button>
                            <button className="create-btn" onClick={handleInputModalSubmit}>
                                <Plus size={16} /> Create {inputModal.type === "category" ? "Category" : "Mode"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {previewModal.open && previewModal.file && (
                <div className="modal-overlay" onClick={() => setPreviewModal({ open: false, file: null })}>
                    <div className="modal-container preview" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {getFileIcon(previewModal.file.mime)}
                                <div>
                                    <div className="preview-filename">{previewModal.file.name || "Attachment"}</div>
                                    <div className="preview-meta">{previewModal.file.mime} • {(previewModal.file.size / 1024).toFixed(1)} KB</div>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setPreviewModal({ open: false, file: null })}><X size={20} /></button>
                        </div>
                        <div className="modal-body preview-content">
                            {previewModal.file.mime?.startsWith('image/') ? (
                                <img src={previewModal.file.url || (previewModal.file instanceof File ? URL.createObjectURL(previewModal.file) : "")} alt="Preview" />
                            ) : previewModal.file.mime === 'application/pdf' ? (
                                <iframe
                                    src={previewModal.file.url || (previewModal.file instanceof File ? URL.createObjectURL(previewModal.file) : "")}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none', borderRadius: '8px', minHeight: '500px' }}
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="no-preview" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                    <LucideFileText size={48} />
                                    <p>Preview not available for this file type.</p>
                                    <a href={previewModal.file.url || (previewModal.file instanceof File ? URL.createObjectURL(previewModal.file) : "")} target="_blank" rel="noreferrer" className="create-btn" style={{ textDecoration: 'none' }}>Open in New Tab</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExpenseForm;
