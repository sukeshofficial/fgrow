import React from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit } from "react-icons/fa";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";

const InvoiceTable = ({ invoices, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="table-container" style={{ padding: '20px 0' }}>
        <TableSkeleton rows={5} columns={7} />
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Client</th>
            <th>Date</th>
            <th>Due Date</th>
            <th>Total Amount</th>
            <th>Balance Due</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td>
                  <span
                    className="invoice-no"
                    style={{ cursor: "pointer", color: "#4338ca" }}
                    onClick={() => navigate(`/finance/invoices/${invoice._id}`)}
                  >
                    {invoice.invoice_no}
                  </span>
                </td>
                <td>
                  <div className="client-info">
                    <span className="client-name-list">{invoice.client?.name || "-"}</span>
                  </div>
                </td>
                <td>{formatDate(invoice.date)}</td>
                <td>{formatDate(invoice.due_date)}</td>
                <td>{formatCurrency(invoice.total_amount)}</td>
                <td>{formatCurrency(invoice.balance_due)}</td>
                <td>
                  <span className={`status-badge ${invoice.status || 'draft'}`}>
                    {(invoice.status || 'draft').replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                    <button className="action-btn" onClick={() => navigate(`/finance/invoices/${invoice._id}`)}>
                      <FaEye style={{ marginRight: '4px' }} /> View
                    </button>
                    <button className="action-btn" style={{ color: '#1d4ed8', background: '#eff6ff', borderColor: '#dbeafe' }} onClick={() => navigate(`/finance/invoices/edit/${invoice._id}`)}>
                      <FaEdit style={{ marginRight: '4px' }} /> Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                No invoices found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(InvoiceTable);
