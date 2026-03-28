import React from "react";
import { FiCheckCircle, FiFileText, FiCalendar, FiUser, FiInfo } from "react-icons/fi";

const InvoiceReviewForm = ({ data, onBack, onSubmit, loading, isEdit = false }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="step-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: '#f5f3ff', 
          borderRadius: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px',
          color: '#7c3aed',
          boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.1)'
        }}>
          <FiCheckCircle size={40} />
        </div>
        <h2 className="form-title" style={{ fontSize: '28px', marginBottom: '12px' }}>
          {isEdit ? "Review Changes" : "Final Review"}
        </h2>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          Please double check the details below before {isEdit ? "updating" : "generating"} the invoice.
        </p>
      </div>

      <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiUser /> Client Info
          </h4>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{data.client_name || "N/A"}</div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Invoice #{data.invoice_no || "DRAFT"}</div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiCalendar /> Important Dates
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Date</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{formatDate(data.date)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Due By</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{formatDate(data.due_date)}</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
           <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <FiFileText /> Itemized Breakdown
           </h4>
        </div>
        
        <div style={{ padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '16px 0', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '16px 0', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Quantity</th>
                <th style={{ padding: '16px 0', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: idx === data.items.length - 1 ? 'none' : '1px solid #f8fafc' }}>
                  <td style={{ padding: '16px 0' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>{item.description}</div>
                    {item.meta?.long_description && <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{item.meta.long_description}</div>}
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right', color: '#64748b' }}>{item.quantity || 1}</td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                    ₹{(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#f8fafc', padding: '32px', borderTop: '1px solid #f1f5f9' }}>
           <div style={{ width: '300px', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Subtotal</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>₹{(data.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Tax Total (GST)</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>₹{(data.total_gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {data.discount_total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Discount</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>-₹{(data.discount_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '2px dashed #e2e8f0' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Grand Total</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#7c3aed' }}>₹{(data.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
           </div>
        </div>
      </div>

      {data.remark && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '16px 24px', borderRadius: '16px', marginBottom: '40px', display: 'flex', gap: '12px' }}>
           <FiInfo style={{ color: '#d97706', marginTop: '3px', flexShrink: 0 }} />
           <div>
             <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: '4px' }}>Remarks / Notes</div>
             <div style={{ fontSize: '14px', color: '#b45309' }}>{data.remark}</div>
           </div>
        </div>
      )}

      <div className="wizard-footer">
        <button type="button" className="back-btn" onClick={onBack}>
          Back
        </button>
        <button 
          type="button"
          className="next-button" 
          onClick={onSubmit} 
          style={{ position: 'static', paddingLeft: '40px', paddingRight: '40px' }}
          disabled={loading}
        >
          {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Invoice" : "Create Invoice & Send")}
        </button>
      </div>
    </div>
  );
};

export default InvoiceReviewForm;
