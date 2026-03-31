import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiShare2,
  FiFileText,
  FiPrinter,
  FiCheckCircle,
  FiEdit3,
  FiTrash2,
  FiDollarSign,
} from "react-icons/fi";
import Sidebar from "../../components/SideBar";
import ShareModal from "./components/ShareModal";
import RecordPaymentModal from "./components/RecordPaymentModal";
import {
  getInvoiceById,
  markPaid,
  addPayment,
  deleteInvoice,
  getPdf,
  sendInvoice
} from "../../features/invoices/invoiceService";
import { Spinner } from "../../components/ui/Spinner";
import { useModal } from "../../context/ModalContext";
import logger from "../../utils/logger.js";
import "./InvoiceDetail.css";

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchInvoice = async () => {
    try {
      const response = await getInvoiceById(id);
      setInvoice(response.data);
    } catch (err) {
      logger.error("InvoiceDetail", "Failed to load invoice", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleMarkPaid = async () => {
    const confirmed = await showConfirm(
      "Confirm Payment",
      "Mark this invoice as fully paid?",
      "confirm"
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await markPaid(id);
      await fetchInvoice();
      await showAlert("Success", "Invoice marked as paid successfully!", "success");
    } catch (err) {
      await showAlert(
        "Failed",
        "Failed to mark as paid: " + (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      setActionLoading(true);
      await addPayment(id, paymentData);
      setIsPaymentModalOpen(false);
      await fetchInvoice();
      await showAlert("Success", "Payment recorded successfully!", "success");
    } catch (err) {
      await showAlert(
        "Failed",
        "Failed to record payment: " + (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      "Delete Invoice",
      "Are you sure you want to delete this invoice? This action cannot be undone.",
      "delete"
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await deleteInvoice(id);
      navigate("/finance/invoices");
      // Optional: success toast instead of modal for redirect
    } catch (err) {
      await showAlert(
        "Failed",
        "Failed to delete invoice: " + (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setActionLoading(true);
      const response = await getPdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      logger.error("InvoiceDetail", "Print failed", error);
      await showAlert("Print Error", "Failed to generate print document.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setActionLoading(true);
      const response = await getPdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoice_no}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      await showAlert(
        "Download Error",
        "Failed to download PDF: " + (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = async (shareData) => {
    try {
      setActionLoading(true);
      await sendInvoice(id, shareData);
      setIsShareModalOpen(false);
      await showAlert("Sent!", "Invoice sent successfully!", "success");
    } catch (err) {
      await showAlert(
        "Send Error",
        "Failed to send invoice: " + (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="clients">
          <div className="invoice-list-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Spinner />
          </div>
        </div>
      </>
    );
  }

  if (!invoice) {
    return (
      <>
        <Sidebar />
        <div className="clients">
          <div className="invoice-list-container">
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <h2 style={{ marginBottom: '20px', color: '#64748b' }}>Invoice Not Found</h2>
              <button className="back-btn" onClick={() => navigate("/finance/invoices")}>Back to Invoices</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const client = invoice.client || {};
  const billingEntity = invoice.billing_entity || {};

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
      <div className="clients">
        <div className="invoice-detail-wrapper">
          {/* Top Bar */}
          <div className="invoice-detail-top-bar">
            <div className="breadcrumb">
              <div className="breadcrumb-back" onClick={() => navigate("/finance/invoices")}>
                <FiArrowLeft style={{ marginRight: '8px' }} /> <span>Back to Invoices</span>
              </div>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Invoice #{invoice.invoice_no}</span>
            </div>

            <div className="invoice-actions">
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

                <button className="action-icon-btn" title="Print Invoice" onClick={handlePrint}>
                  <FiPrinter />
                </button>
              </div>

              {invoice.status !== 'paid' && (
                <>
                  <button
                    className="action-btn-styled btn-record-payment"
                    onClick={() => setIsPaymentModalOpen(true)}
                    disabled={actionLoading}
                  >
                    <FiDollarSign /> Record Payment
                  </button>
                  <button
                    className="action-btn-styled btn-mark-paid"
                    onClick={handleMarkPaid}
                    disabled={actionLoading}
                  >
                    <FiCheckCircle /> Mark Paid
                  </button>
                </>
              )}

              <button
                className="action-btn-styled btn-edit"
                onClick={() => navigate(`/finance/invoices/edit/${id}`)}
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

          {/* Invoice Paper */}
          <div className="invoice-paper">
            <div className="invoice-paper-header">
              <div className="business-info">
                {billingEntity.logoUrl ? (
                  <img src={billingEntity.logoUrl} alt="Business Logo" className="business-logo" />
                ) : (
                  <div className="business-logo-text">
                    {billingEntity.name || 'Your Company'}
                  </div>
                )}
                <div className="business-name">{billingEntity.name}</div>
              </div>

              <div className="invoice-meta-header">
                <div className="invoice-type-title">TAX INVOICE</div>
                <div className={`invoice-status-pill ${invoice.status}`}>
                  {invoice.status?.toUpperCase() || 'DRAFT'}
                </div>
              </div>
            </div>

            <div className="billing-info-grid">
              <div className="client-billing-section">
                <h4 className="info-section-title">Bill To</h4>
                <div className="client-name">{client.name}</div>
                {formatAddress(client.address) && (
                  <div className="client-address">
                    {formatAddress(client.address)}
                  </div>
                )}
                {(client.primary_contact_mobile || client.phone) && <div className="client-address" style={{ marginTop: '8px' }}>M: {client.primary_contact_mobile || client.phone}</div>}
                {(client.primary_contact_email || client.email) && <div className="client-address">E: {client.primary_contact_email || client.email}</div>}
                {client.gstin && <div className="client-gstin" style={{ marginTop: '12px', fontSize: '13px', fontWeight: 700 }}>GSTIN: {client.gstin}</div>}
              </div>

              <div className="invoice-metadata-section">
                <h4 className="info-section-title">Invoice Details</h4>
                <div className="meta-records">
                  <div className="meta-item">
                    <span className="meta-label">Invoice No:</span>
                    <span className="meta-value">{invoice.invoice_no}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">{new Date(invoice.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  {invoice.due_date && (
                    <div className="meta-item">
                      <span className="meta-label">Due Date:</span>
                      <span className="meta-value">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}
                  {invoice.place_of_supply && (
                    <div className="meta-item">
                      <span className="meta-label">Place of Supply:</span>
                      <span className="meta-value">{invoice.place_of_supply}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Description</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>GST</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="item-desc">{item.description}</div>
                        {item.meta?.long_description && <div className="item-sub-desc">{item.meta.long_description}</div>}
                      </td>
                      <td>₹{item.unit_price?.toLocaleString('en-IN')}</td>
                      <td>{item.quantity || 1}</td>
                      <td>{item.gst_rate}%</td>
                      <td style={{ fontWeight: 700 }}>₹{item.total_amount?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                      No items found in this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="totals-area">
              <div className="totals-card">
                <div className="total-row">
                  <span>Sub Total</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{invoice.subtotal?.toLocaleString('en-IN') || "0.00"}</span>
                </div>
                <div className="total-row">
                  <span>Tax Total</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{invoice.total_gst?.toLocaleString('en-IN') || "0.00"}</span>
                </div>
                {invoice.discount_total > 0 && (
                  <div className="total-row">
                    <span>Discount</span>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>-₹{invoice.discount_total?.toLocaleString('en-IN') || "0.00"}</span>
                  </div>
                )}
                {invoice.round_off !== 0 && (
                  <div className="total-row">
                    <span>Round Off</span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{invoice.round_off?.toLocaleString('en-IN') || "0.00"}</span>
                  </div>
                )}
                <div className="total-row grand-total">
                  <span>TOTAL</span>
                  <span className="grand-total-value">₹{invoice.total_amount?.toLocaleString('en-IN') || "0.00"}</span>
                </div>
                {invoice.amount_received > 0 && (
                  <>
                    <div className="total-row" style={{ marginTop: '12px' }}>
                      <span>Amount Received</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>-₹{invoice.amount_received?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="total-row grand-total" style={{ borderTop: '1px dashed #e2e8f0', marginTop: '12px', paddingTop: '12px', color: '#ef4444' }}>
                      <span>BALANCE DUE</span>
                      <span className="grand-total-value" style={{ color: '#ef4444' }}>₹{invoice.balance_due?.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSend={handleShare}
        initialEmail={invoice?.client?.email}
        businessName={billingEntity.name}
        loading={actionLoading}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onRecord={handleRecordPayment}
        balanceDue={invoice.balance_due}
        loading={actionLoading}
      />
    </>
  );
};

export default InvoiceDetail;
