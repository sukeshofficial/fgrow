import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiPrinter,
    FiShare2,
    FiEdit3,
    FiTrash2,
    FiFileText,
    FiUser,
    FiHome,
    FiCalendar,
    FiLink,
    FiX,
    FiInfo,
    FiCheckCircle
} from "react-icons/fi";
import Sidebar from "../../components/SideBar";
import ShareModal from "../invoices/components/ShareModal";
import ApplyInvoiceModal from "./components/ApplyInvoiceModal";
import receiptService from "../../features/receipts/receiptService";
import { Spinner } from "../../components/ui/Spinner";
import { useModal } from "../../context/ModalContext";
import logger from "../../utils/logger";
import "./ReceiptDetail.css";

const ReceiptDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showAlert, showConfirm } = useModal();
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    const fetchReceipt = async () => {
        try {
            setLoading(true);
            const response = await receiptService.getReceipt(id);
            setReceipt(response.data);
        } catch (err) {
            logger.error("ReceiptDetail", "Failed to fetch receipt", err);
            showAlert("Error", "Failed to load receipt details.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipt();
    }, [id]);

    const handlePrint = async () => {
        try {
            setActionLoading(true);
            const response = await receiptService.printReceipt(id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            logger.error("ReceiptDetail", "Print failed", err);
            showAlert("Print Error", "Failed to generate receipt PDF.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            setActionLoading(true);
            const response = await receiptService.printReceipt(id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Receipt-${receipt?.receipt_no || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            logger.error("ReceiptDetail", "Download failed", err);
            showAlert("Download Error", "Failed to download receipt PDF.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleShare = async (shareData) => {
        try {
            setActionLoading(true);
            await receiptService.sendReceipt(id, shareData);
            showAlert("Sent!", "Receipt sent successfully!", "success");
            setIsShareModalOpen(false);
        } catch (err) {
            logger.error("ReceiptDetail", "Email failed", err);
            const msg = err.response?.data?.message || "Failed to email receipt.";
            showAlert("Error", msg, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm(
            "Delete Receipt",
            "Are you sure you want to delete this receipt? This will also unapply all linked invoices.",
            "delete"
        );
        if (!confirmed) return;

        try {
            setActionLoading(true);
            await receiptService.deleteReceipt(id);
            navigate("/finance/receipts");
        } catch (err) {
            logger.error("ReceiptDetail", "Delete failed", err);
            showAlert("Error", "Failed to delete receipt.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnapply = async (invoiceId) => {
        const confirmed = await showConfirm(
            "Unapply Invoice",
            "Are you sure you want to unapply this invoice? This will increase the invoice's balance due.",
            "warning"
        );
        if (!confirmed) return;

        try {
            setActionLoading(true);
            await receiptService.unapplyReceipt(id, [invoiceId]);
            await fetchReceipt();
            showAlert("Success", "Invoice unapplied successfully.", "success");
        } catch (err) {
            logger.error("ReceiptDetail", "Unapply failed", err);
            showAlert("Error", "Failed to unapply invoice.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Sidebar />
                <div className="receipt-detail-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <Spinner />
                </div>
            </>
        );
    }

    if (!receipt) {
        return (
            <>
                <Sidebar />
                <div className="receipt-detail-wrapper">
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <h2 style={{ marginBottom: '20px', color: '#64748b' }}>Receipt Not Found</h2>
                        <button className="breadcrumb-back" onClick={() => navigate("/finance/receipts")}>Back to Receipts</button>
                    </div>
                </div>
            </>
        );
    }

    const client = receipt.client || {};
    const billingEntity = (receipt.billing_entity && typeof receipt.billing_entity === 'object')
        ? receipt.billing_entity
        : { name: 'Your Company' };

    // Calculate available balance
    const alreadyApplied = (receipt.applied_invoices || []).reduce((sum, inv) => sum + (inv.amount_applied || 0), 0);
    const availableAmount = Math.max(0, (receipt.total_amount || 0) - alreadyApplied);

    const formatAddress = (addr) => {
        if (!addr) return null;
        if (typeof addr === 'string') return addr;
        const { street, city, state, postalCode, country } = addr;
        const parts = [street, city, state, postalCode, country].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : null;
    };

    return (
        <>
            <Sidebar />
            <div className="finance">
                <div className="receipt-detail-wrapper">
                    {/* Top Bar */}
                    <div className="receipt-detail-top-bar">
                        <div className="breadcrumb">
                            <div className="breadcrumb-back" onClick={() => navigate("/finance/receipts")}>
                                <FiArrowLeft style={{ marginRight: '8px' }} /> <span>Back to Receipts</span>
                            </div>
                            <span className="breadcrumb-separator">/</span>
                            <span className="breadcrumb-current">Receipt #{receipt.receipt_no}</span>
                        </div>

                        <div className="receipt-actions">
                            <div style={{ display: 'flex', gap: '8px', borderRight: '1px solid #f1f5f9', paddingRight: '16px', marginRight: '8px' }}>
                                <button
                                    className="action-icon-btn"
                                    title="Share via Email"
                                    onClick={() => setIsShareModalOpen(true)}
                                    disabled={actionLoading}
                                >
                                    <FiShare2 />
                                </button>
                                <button className="action-icon-btn" title="Download PDF" onClick={handleDownloadPdf} disabled={actionLoading}>
                                    <FiFileText />
                                </button>
                                <button className="action-icon-btn" title="Print Receipt" onClick={handlePrint} disabled={actionLoading}>
                                    <FiPrinter />
                                </button>
                            </div>

                            <button
                                className="action-btn-styled"
                                style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}
                                onClick={() => navigate(`/finance/receipts/edit/${id}`)}
                                disabled={actionLoading || receipt.status === 'settled'}
                            >
                                <FiEdit3 /> Edit
                            </button>

                            <button
                                className="action-btn-styled btn-delete"
                                onClick={handleDelete}
                                disabled={actionLoading}
                            >
                                <FiTrash2 /> Delete
                            </button>
                        </div>
                    </div>

                    {/* Receipt Paper */}
                    <div className="receipt-paper">
                        <div className="receipt-paper-header">
                            <div className="business-info">
                                {billingEntity.logoUrl ? (
                                    <img src={billingEntity.logoUrl} alt="Business Logo" className="business-logo" />
                                ) : (
                                    <div className="business-logo-text">
                                        {billingEntity.name || 'Your Company'}
                                    </div>
                                )}
                                <div className="business-name">{billingEntity.name}</div>
                                <div className="business-address">
                                    {billingEntity.officialAddress ||
                                        billingEntity.address ||
                                        formatAddress(billingEntity.companyAddress)}
                                </div>
                                {(billingEntity.companyPhone) && <div className="business-address">P: {billingEntity.companyPhone}</div>}
                                {(billingEntity.companyEmail) && <div className="business-address">E: {billingEntity.companyEmail}</div>}
                                {(billingEntity.gstNumber || billingEntity.gstin) && (
                                    <div className="business-address" style={{ marginTop: '4px', fontWeight: 700 }}>
                                        GSTIN: {billingEntity.gstNumber || billingEntity.gstin}
                                    </div>
                                )}
                            </div>

                            <div className="receipt-meta-header">
                                <div className="receipt-type-title">PAYMENT RECEIPT</div>
                                <div className={`status-pill ${receipt.status}`}>
                                    {receipt.status?.split('_').join(' ').toUpperCase() || 'DRAFT'}
                                </div>
                            </div>
                        </div>

                        <div className="billing-info-grid">
                            <div className="client-billing-section">
                                <h4 className="info-section-title">Received From</h4>
                                <div className="client-name">{client.name}</div>
                                {client.primary_contact_email && <div className="client-address">{client.primary_contact_email}</div>}
                                {client.primary_contact_mobile && <div className="client-address">M: {client.primary_contact_mobile}</div>}
                            </div>

                            <div className="receipt-metadata-section">
                                <h4 className="info-section-title">Receipt Details</h4>
                                <div className="meta-records">
                                    <div className="meta-item">
                                        <span className="meta-label">Receipt No:</span>
                                        <span className="meta-value">{receipt.receipt_no}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Date:</span>
                                        <span className="meta-value">{new Date(receipt.date).toLocaleDateString('en-IN')}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Method:</span>
                                        <span className="meta-value" style={{ textTransform: 'capitalize' }}>{receipt.payment_method || 'Other'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 className="info-section-title" style={{ marginBottom: 0, border: 'none' }}>Applied Invoices</h4>
                                {availableAmount > 0 && (
                                    <button
                                        className="action-btn-styled"
                                        style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px' }}
                                        onClick={() => setIsApplyModalOpen(true)}
                                    >
                                        <FiLink style={{ marginRight: '8px' }} /> Apply to Invoices
                                    </button>
                                )}
                            </div>
                            <table className="applied-table">
                                <thead>
                                    <tr>
                                        <th>Invoice No</th>
                                        <th>Date</th>
                                        <th>Invoice Total</th>
                                        <th>Applied Amount</th>
                                        <th>Remaining Balance</th>
                                        <th style={{ width: '50px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(receipt.applied_invoices || []).length > 0 ? (
                                        receipt.applied_invoices.map((alloc, idx) => (
                                            <tr key={idx}>
                                                <td className="inv-no-cell" onClick={() => navigate(`/finance/invoices/${alloc.invoice}`)}>
                                                    {alloc.invoice_no}
                                                </td>
                                                <td>{alloc.invoice_date ? new Date(alloc.invoice_date).toLocaleDateString('en-IN') : "-"}</td>
                                                <td>₹{alloc.invoice_amount?.toLocaleString('en-IN')}</td>
                                                <td style={{ fontWeight: 700, color: '#10b981' }}>₹{alloc.amount_applied?.toLocaleString('en-IN')}</td>
                                                <td style={{ fontWeight: 600, color: (alloc.invoice_balance || 0) > 0 ? '#ef4444' : '#64748b' }}>
                                                    ₹{(alloc.invoice_balance || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td>
                                                    <button className="btn-unapply" title="Unapply" onClick={() => handleUnapply(alloc.invoice)}>
                                                        <FiX />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="empty-row">
                                                No invoices settled with this receipt.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="totals-area">
                            <div className="totals-card">
                                <div className="total-row">
                                    <span>Received Amount</span>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{receipt.received_amount?.toLocaleString('en-IN')}</span>
                                </div>
                                {receipt.tds_amount > 0 && (
                                    <div className="total-row">
                                        <span>TDS Deducted (-)</span>
                                        <span style={{ fontWeight: 700, color: '#ef4444' }}>-₹{receipt.tds_amount?.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                {receipt.discount > 0 && (
                                    <div className="total-row">
                                        <span>Discount (-)</span>
                                        <span style={{ fontWeight: 700, color: '#ef4444' }}>-₹{receipt.discount?.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="total-row grand-total">
                                    <span>TOTAL</span>
                                    <span className="grand-total-value">₹{receipt.total_amount?.toLocaleString('en-IN')}</span>
                                </div>

                                <div className="total-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                    <span>Already Applied</span>
                                    <span style={{ fontWeight: 700, color: '#10b981' }}>-₹{alreadyApplied?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="total-row" style={{ color: availableAmount > 0 ? '#4f46e5' : '#64748b' }}>
                                    <span>Unapplied Balance</span>
                                    <span style={{ fontWeight: 800 }}>₹{availableAmount?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {receipt.remark && (
                            <div style={{ marginTop: '40px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <FiInfo /> Remarks
                                </div>
                                <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{receipt.remark}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onSend={handleShare}
                initialEmail={receipt?.client?.primary_contact_email}
                businessName={receipt?.billing_entity?.name}
                loading={actionLoading}
                type="Receipt"
            />

            <ApplyInvoiceModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                clientId={client._id}
                receiptId={id}
                availableAmount={availableAmount}
                onApplied={fetchReceipt}
            />
        </>
    );
};

export default ReceiptDetail;
