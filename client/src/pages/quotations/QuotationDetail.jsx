import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiPrinter,
    FiShare2,
    FiEdit3,
    FiTrash2,
    FiFileText,
    FiInfo,
    FiCheckCircle,
    FiRepeat
} from "react-icons/fi";
import Sidebar from "../../components/SideBar";
import ShareModal from "../invoices/components/ShareModal";
import quotationService from "../../features/quotations/quotationService";
import { Spinner } from "../../components/ui/Spinner";
import { useModal } from "../../context/ModalContext";
import logger from "../../utils/logger";
import "./quotations.css";

const QuotationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showAlert, showConfirm } = useModal();
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const fetchQuotation = async () => {
        try {
            setLoading(true);
            const response = await quotationService.getQuotation(id);
            setQuotation(response.data);
        } catch (err) {
            logger.error("QuotationDetail", "Failed to fetch quotation", err);
            showAlert("Error", "Failed to load quotation details.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotation();
    }, [id]);

    const handleDownloadPdf = async () => {
        try {
            setActionLoading(true);
            const response = await quotationService.printQuotation(id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation-${quotation?.quotation_no || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            logger.error("QuotationDetail", "Download failed", err);
            showAlert("Download Error", "Failed to download quotation PDF.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePrint = async () => {
        try {
            setActionLoading(true);
            const response = await quotationService.printQuotation(id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            logger.error("QuotationDetail", "Print failed", err);
            showAlert("Print Error", "Failed to generate quotation PDF.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleShare = async (shareData) => {
        try {
            setActionLoading(true);
            await quotationService.sendQuotation(id, shareData);
            showAlert("Sent!", "Quotation sent successfully!", "success");
            setIsShareModalOpen(false);
        } catch (err) {
            logger.error("QuotationDetail", "Email failed", err);
            const msg = err.response?.data?.message || "Failed to email quotation.";
            showAlert("Error", msg, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm(
            "Delete Quotation",
            "Are you sure you want to delete this quotation?",
            "delete"
        );
        if (!confirmed) return;

        try {
            setActionLoading(true);
            await quotationService.deleteQuotation(id);
            navigate("/finance/quotations");
        } catch (err) {
            logger.error("QuotationDetail", "Delete failed", err);
            showAlert("Error", "Failed to delete quotation.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleConvertToInvoice = async () => {
        const confirmed = await showConfirm(
            "Convert to Invoice",
            "Do you want to convert this quotation into a draft invoice?",
            "info"
        );
        if (!confirmed) return;

        try {
            setActionLoading(true);
            const resp = await quotationService.convertToInvoice(id);
            showAlert("Success", "Quotation converted to Invoice draft.", "success");
            // Optionally navigate to the new invoice
            if (resp.data?._id) navigate(`/finance/invoices/${resp.data._id}`);
        } catch (err) {
            logger.error("QuotationDetail", "Conversion failed", err);
            showAlert("Error", "Failed to convert quotation.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Sidebar />
                <div className="quotation-detail-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <Spinner />
                </div>
            </>
        );
    }

    if (!quotation) {
        return (
            <>
                <Sidebar />
                <div className="quotation-detail-wrapper">
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <h2 style={{ marginBottom: '20px', color: '#64748b' }}>Quotation Not Found</h2>
                        <button className="breadcrumb-back" onClick={() => navigate("/finance/quotations")}>Back to Quotations</button>
                    </div>
                </div>
            </>
        );
    }

    const client = quotation.client || {};
    const tenant = quotation.tenant_id || {};
    const seller = {
        name: quotation.billing_entity?.name || tenant.name || 'Your Company',
        officialAddress: quotation.billing_entity?.address || tenant.officialAddress || '',
        gstNumber: quotation.billing_entity?.gstin || tenant.gstNumber || '',
    };

    const formatAddress = (addr) => {
        if (!addr) return null;
        if (typeof addr === 'string') return addr;
        const { street, city, state, postalCode, country } = addr;
        const parts = [street, city, state, postalCode, country].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : null;
    };

    const clientAddress = formatAddress(client.address);
    if (!seller.officialAddress && tenant.companyAddress) {
        seller.officialAddress = formatAddress(tenant.companyAddress);
    }

    return (
        <>
            <Sidebar />
            <div className="clients">
                <div className="quotation-detail-wrapper">
                    <div className="quotation-detail-top-bar">
                        <div className="breadcrumb">
                            <div className="breadcrumb-back" onClick={() => navigate("/finance/quotations")}>
                                <FiArrowLeft style={{ marginRight: '8px' }} /> <span>Back to Quotations</span>
                            </div>
                            <span className="breadcrumb-separator">/</span>
                            <span className="breadcrumb-current">Quotation #{quotation.quotation_no}</span>
                        </div>

                        <div className="quotation-actions">
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
                                <button
                                    className="action-icon-btn"
                                    title="Print Quotation"
                                    onClick={handlePrint}
                                    disabled={actionLoading}
                                >
                                    <FiPrinter />
                                </button>
                            </div>

                            <button
                                className="action-btn-styled"
                                style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}
                                onClick={handleConvertToInvoice}
                                disabled={actionLoading || quotation.status === 'converted'}
                            >
                                <FiRepeat /> Convert to Invoice
                            </button>

                            <button
                                className="action-btn-styled"
                                onClick={() => navigate(`/finance/quotations/edit/${id}`)}
                                disabled={actionLoading}
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

                    <div className="quotation-paper">
                        <div className="quotation-paper-header">
                            <div className="business-info">
                                <img
                                    src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1775310579/tenants/a7tvcuo0moqztzeoevaz.png"
                                    alt="Logo"
                                    className="business-logo"
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px', border: '1px solid #f1f5f9' }}
                                />
                                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                                    {seller.name}
                                </h2>
                                <div className="business-address">
                                    {seller.officialAddress}
                                </div>
                                {seller.gstNumber && (
                                    <div className="business-address" style={{ marginTop: '4px', fontWeight: 700 }}>
                                        GSTIN: {seller.gstNumber}
                                    </div>
                                )}
                            </div>

                            <div className="quotation-meta-header">
                                <div className="quotation-type-title">QUOTATION</div>
                                <div className={`status-pill ${quotation.status || 'pending'}`}>
                                    {(quotation.status || 'pending').toUpperCase()}
                                </div>
                            </div>
                        </div>

                        <div className="billing-info-grid">
                            <div className="client-billing-section">
                                <h4 className="info-section-title">Quotation For</h4>
                                <div className="client-name">{client.name}</div>
                                {clientAddress && <div className="client-address">{clientAddress}</div>}
                                {client.primary_contact_email && <div className="client-address" style={{ marginTop: '4px' }}>{client.primary_contact_email}</div>}
                                {client.gstin && <div className="client-address" style={{ marginTop: '8px', fontWeight: 700, color: '#1e293b' }}>GSTIN: {client.gstin}</div>}
                            </div>

                            <div className="quotation-metadata-section">
                                <h4 className="info-section-title">Quotation Details</h4>
                                <div className="meta-records">
                                    <div className="meta-item">
                                        <span className="meta-label">Quotation No:</span>
                                        <span className="meta-value">{quotation.quotation_no}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Date:</span>
                                        <span className="meta-value">{new Date(quotation.date).toLocaleDateString('en-IN')}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Valid Until:</span>
                                        <span className="meta-value">{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-IN') : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>GST %</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(quotation.items || []).map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 700 }}>{item.description}</td>
                                        <td>{item.quantity}</td>
                                        <td>₹{item.unit_price?.toLocaleString('en-IN')}</td>
                                        <td>{item.gst_rate}%</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.total_amount?.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="totals-area">
                            <div className="totals-card">
                                <div className="total-row">
                                    <span>Subtotal</span>
                                    <span style={{ fontWeight: 700 }}>₹{quotation.subtotal?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="total-row">
                                    <span>GST Total</span>
                                    <span style={{ fontWeight: 700 }}>₹{quotation.total_gst?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="total-row grand-total">
                                    <span>TOTAL</span>
                                    <span className="grand-total-value">₹{quotation.total_amount?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {quotation.terms && (
                            <div style={{ marginTop: '60px', borderTop: '1px solid #f1f5f9', paddingTop: '30px' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Terms & Conditions</h4>
                                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{quotation.terms}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onSend={handleShare}
                initialEmail={client?.primary_contact_email}
                businessName={seller?.name}
                loading={actionLoading}
                type="Quotation"
            />
        </>
    );
};

export default QuotationDetail;
