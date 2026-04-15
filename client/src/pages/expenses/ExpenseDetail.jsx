import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import * as expenseApi from "../../api/expense.api";
import { Spinner } from "../../components/ui/Spinner";
import { useModal } from "../../context/ModalContext";
import logger from "../../utils/logger";
import {
    ArrowLeft,
    Edit2,
    Trash2,
    FileText,
    Download,
    ExternalLink,
    Clock,
    User,
    Layers,
    CreditCard
} from "lucide-react";
import "./expenses.css";

const ExpenseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showAlert, showConfirm } = useModal();
    const [loading, setLoading] = useState(true);
    const [expense, setExpense] = useState(null);

    useEffect(() => {
        const fetchExpense = async () => {
            try {
                const res = await expenseApi.getExpense(id);
                setExpense(res.data.data);
            } catch (err) {
                logger.error("ExpenseDetail", "Fetch failed", err);
                showAlert("Error", "Failed to load expense details.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchExpense();
    }, [id]);

    const handleDelete = async () => {
        const confirmed = await showConfirm(
            "Delete Expense",
            "Are you sure you want to delete this expense? This action cannot be undone.",
            "danger"
        );
        if (confirmed) {
            try {
                await expenseApi.deleteExpense(id);
                showAlert("Deleted", "Expense deleted successfully", "success");
                navigate("/finance/expenses");
            } catch (err) {
                logger.error("ExpenseDetail", "Delete failed", err);
                showAlert("Error", "Failed to delete expense.", "error");
            }
        }
    };

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            logger.error("ExpenseDetail", "Download failed", error);
            window.open(url, '_blank');
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>;
    if (!expense) return <div className="expense-list-container"><h1>Expense not found.</h1></div>;

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-IN", {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(amount);

    return (
        <>
            <Sidebar />
            <div className="finance">
                <div className="expense-list-container" style={{ paddingTop: '16px' }}>
                    <div className="expense-header" style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <button className="icon-btn" onClick={() => navigate("/finance/expenses")}>
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Space Mono, monospace', color: '#0f172a' }}>{expense.expense_no}</h1>
                                <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Recorded on {formatDate(expense.date)}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="toggle-btn" style={{ background: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0' }} onClick={() => navigate(`/finance/expenses/edit/${id}`)}>
                                <Edit2 size={16} /> Edit
                            </button>
                            <button className="toggle-btn" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleDelete}>
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 1fr', gap: '32px' }}>
                        {/* Main Content */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div className="form-card" style={{ padding: '40px' }}>
                                <div style={{ marginBottom: '40px' }}>
                                    <h3 className="form-section-title" style={{ marginBottom: '32px' }}>Expense Summary</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                                                <Layers size={20} />
                                            </div>
                                            <div>
                                                <div className="form-label" style={{ marginBottom: '4px' }}>Category</div>
                                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '16px' }}>{expense.category?.name || "Uncategorized"}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="form-label" style={{ marginBottom: '4px' }}>Client</div>
                                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '16px' }}>{expense.client?.name || "Non-client expense"}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534', flexShrink: 0 }}>
                                                <CreditCard size={20} />
                                            </div>
                                            <div>
                                                <div className="form-label" style={{ marginBottom: '4px' }}>Payment Mode</div>
                                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '16px' }}>{expense.payment_mode?.name || "Not specified"}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', flexShrink: 0 }}>
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <div className="form-label" style={{ marginBottom: '4px' }}>Billing Status</div>
                                                <div className={`status-badge ${expense.billing_status}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                                                    {expense.billing_status?.replace("_", " ")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <h3 className="form-section-title">Notes</h3>
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                                        {expense.notes || "No notes provided for this expense."}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="form-section-title">Attachments ({expense.files?.length || 0})</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                                        {expense.files?.map((file, idx) => (
                                            <div key={idx} className="file-card" style={{ padding: '16px' }}>
                                                <div className="file-icon" style={{ fontSize: '24px' }}><FileText size={24} /></div>
                                                <div className="file-info">
                                                    <div className="file-name" title={file.name}>{file.name || "Attachment"}</div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{(file.size / 1024).toFixed(1)} KB</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="icon-btn" title="View">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                    <button onClick={() => handleDownload(file.url, file.name)} className="icon-btn" title="Download" style={{ background: 'none' }}>
                                                        <Download size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!expense.files || expense.files.length === 0) && (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '16px', background: '#f8fafc' }}>
                                                No files attached.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar / Financials */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div className="settings-card">
                                <h3 className="card-title">Financial Breakdown</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Base Amount</span>
                                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '16px' }}>₹{expense.amount?.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Tax / TDS (-)</span>
                                        <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '16px' }}>₹{expense.tds_amount?.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Discount (-)</span>
                                        <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '16px' }}>₹{expense.discount?.toFixed(2)}</span>
                                    </div>
                                    <div style={{ marginTop: '12px', paddingTop: '20px', borderTop: '2px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Amount</span>
                                        <span style={{ fontSize: '28px', fontWeight: 900, color: '#7c3aed' }}>₹{expense.total_amount?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {expense.invoice && (
                                <div className="settings-card">
                                    <h3 className="card-title">Related Invoice</h3>
                                    <div
                                        className="file-card"
                                        style={{ cursor: 'pointer', background: '#f8fafc' }}
                                        onClick={() => navigate(`/finance/invoices/${expense.invoice._id}`)}
                                    >
                                        <div className="file-icon" style={{ color: '#7c3aed' }}><FileText size={20} /></div>
                                        <div className="file-info">
                                            <div className="file-name" style={{ fontWeight: 700 }}>{expense.invoice.invoice_no}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Billed on {formatDate(expense.invoice.date)}</div>
                                        </div>
                                        <ExternalLink size={16} style={{ color: '#94a3b8' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ExpenseDetail;
