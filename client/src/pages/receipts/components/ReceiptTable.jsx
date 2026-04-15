import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Calendar, User } from "lucide-react";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";

const ReceiptTable = ({ receipts, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="table-container" style={{ padding: '20px 0' }}>
                <TableSkeleton rows={5} columns={6} />
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

    const getStatusClass = (status) => {
        switch (status) {
            case "settled": return "settled";
            case "partially_settled": return "partially_settled";
            case "cancelled": return "cancelled";
            default: return "draft";
        }
    };

    const formatStatus = (status) => {
        return status.split('_').join(' ');
    };

    return (
        <div className="table-container">
            <table className="modern-table">
                <thead>
                    <tr>
                        <th>Receipt info</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {receipts.length > 0 ? (
                        receipts.map((receipt) => (
                            <tr key={receipt._id}>
                                <td>
                                    <div className="receipt-info">
                                        <div className="receipt-no" style={{ fontWeight: 700, color: '#7c3aed', cursor: 'pointer' }} onClick={() => navigate(`/finance/receipts/${receipt._id}`)}>
                                            {receipt.receipt_no}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="client-info">
                                        <span className="client-name" style={{ fontWeight: 500, color: '#1e293b' }}>
                                            {receipt.client?.name || "-"}
                                        </span>
                                        {receipt.client?.file_no && (
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>File: {receipt.client.file_no}</div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                                        <Calendar size={13} />
                                        {formatDate(receipt.date)}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>
                                        {formatCurrency(receipt.total_amount)}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(receipt.status)}`}>
                                        {formatStatus(receipt.status)}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="action-btn"
                                            title="View Details"
                                            onClick={() => navigate(`/finance/receipts/${receipt._id}`)}
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            className="action-btn"
                                            title="Edit Receipt"
                                            style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}
                                            onClick={() => navigate(`/finance/receipts/edit/${receipt._id}`)}
                                            disabled={receipt.status === 'settled'}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                                No receipts found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ReceiptTable;
