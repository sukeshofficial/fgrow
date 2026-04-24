import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye, FaEdit, FaTrash, FaHashtag, FaUser,
  FaCalendarAlt, FaRupeeSign, FaInfoCircle, FaTasks
} from "react-icons/fa";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";

const InvoiceTable = ({ invoices, loading, selectedIds = [], onSelect, onSelectAll, onDelete }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="table-container" style={{ padding: '20px 0' }}>
        <TableSkeleton rows={5} columns={8} />
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
    const date = new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return (
      <div className="date-chip">
        <span>{date}</span>
      </div>
    );
  };

  const allSelected = invoices.length > 0 && selectedIds.length === invoices.length;

  return (
    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            <th className="checkbox-cell">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="table-checkbox"
              />
            </th>
            <th><div className="header-icon-wrapper"><FaHashtag size={12} /> Invoice No</div></th>
            <th><div className="header-icon-wrapper"><FaUser size={12} /> Client</div></th>
            <th><div className="header-icon-wrapper"><FaCalendarAlt size={12} /> Date</div></th>
            <th><div className="header-icon-wrapper"><FaCalendarAlt size={12} /> Due Date</div></th>
            <th><div className="header-icon-wrapper"><FaRupeeSign size={12} /> Total Amount</div></th>
            <th><div className="header-icon-wrapper"><FaRupeeSign size={12} /> Balance Due</div></th>
            <th><div className="header-icon-wrapper"><FaInfoCircle size={12} /> Status</div></th>
            <th><div className="header-icon-wrapper"><FaTasks size={12} /> Actions</div></th>
          </tr>
        </thead>
        <tbody>
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <tr key={invoice._id} className={selectedIds.includes(invoice._id) ? 'selected-row' : ''}>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(invoice._id)}
                    onChange={() => onSelect(invoice._id)}
                    className="table-checkbox"
                  />
                </td>
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
                <td>
                  <span className={invoice.balance_due > 0 ? 'balance-warning' : 'balance-paid'}>
                    {formatCurrency(invoice.balance_due)}
                  </span>
                </td>
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
                    <button className="action-btn edit" onClick={() => navigate(`/finance/invoices/edit/${invoice._id}`)}>
                      <FaEdit style={{ marginRight: '4px' }} /> Edit
                    </button>
                    <button className="action-btn delete" onClick={() => onDelete(invoice._id)}>
                      <FaTrash style={{ marginRight: '4px' }} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
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
