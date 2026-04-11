import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import quotationService from "../../features/quotations/quotationService";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import logger from "../../utils/logger.js";
import { Plus, Search, Filter, Eye, MoreHorizontal, Download, Send, FileText, Trash2, Pencil } from "lucide-react";
import "./quotations.css";

const QuotationList = () => {
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
    const [filters, setFilters] = useState({
        search: "",
        status: 'all',
        date_from: "",
        date_to: ""
    });

    const showLoading = useDelayedLoading(loading, 300);

    const fetchQuotations = async (currentFilters, currentPage) => {
        setLoading(true);
        try {
            const activeFilter = currentFilters.status === 'all' ? {} : { status: currentFilters.status };
            const params = {
                page: currentPage,
                limit: pagination.limit,
                search: currentFilters.search,
                date_from: currentFilters.date_from,
                date_to: currentFilters.date_to,
                ...activeFilter,
            };

            const resp = await quotationService.listQuotations(params);
            setQuotations(resp.data);
            const meta = resp.pagination;
            setPagination({
                page: meta.page,
                limit: meta.limit,
                total: meta.total,
                total_pages: meta.total_pages
            });
        } catch (e) {
            logger.error("QuotationList", "Failed to fetch quotations", e);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    useEffect(() => {
        fetchQuotations(filters, pagination.page);
    }, [filters, pagination.page]);

    const getStatusClass = (status) => {
        switch (status) {
            case 'accepted': return 'status-accepted';
            case 'rejected': return 'status-rejected';
            case 'cancelled': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    return (
        <>
            <Sidebar />
            <div className="clients">
                <div className="quotation-list-container" style={{ padding: '24px' }}>
                    <div className="quotation-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>Quotations</h1>
                            <p style={{ color: '#64748b', fontSize: '14px' }}>Manage and track your business quotations</p>
                        </div>
                        <button
                            className="action-btn-styled"
                            style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '10px 20px' }}
                            onClick={() => navigate("/finance/quotations/create")}
                        >
                            <Plus size={18} />
                            Create Quotation
                        </button>
                    </div>

                    <div className="filter-bar" style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search quotation no, client..."
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                        <select
                            style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Quotation NO</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Client</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading quotations...</td></tr>
                                ) : quotations.length === 0 ? (
                                    <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No quotations found.</td></tr>
                                ) : (
                                    quotations.map((q) => (
                                        <tr key={q._id} style={{ borderBottom: '1px solid #f1f5f9' }} className="table-row-hover">
                                            <td style={{ padding: '16px', fontWeight: '700' }}>
                                                <span
                                                    onClick={() => navigate(`/finance/quotations/${q._id}`)}
                                                    className="clickable-number"
                                                    style={{ color: '#7c3aed', cursor: 'pointer' }}
                                                >
                                                    {q.quotation_no}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', color: '#475569' }}>{q.client?.name || '-'}</td>
                                            <td style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>{new Date(q.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '16px', fontWeight: '700', color: '#1e293b' }}>₹{q.total_amount?.toLocaleString()}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span className={`status-pill ${q.status || 'pending'}`}>{q.status || 'pending'}</span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => navigate(`/finance/quotations/${q._id}`)}
                                                        className="action-icon-btn"
                                                    >
                                                        <Eye size={16} color="#64748b" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/finance/quotations/edit/${q._id}`)}
                                                        className="action-icon-btn edit-btn-list"
                                                    >
                                                        <Pencil size={16} color="#7c3aed" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Reuse the logic from ReceiptList if needed, or simple version here */}
                </div>
            </div>
        </>
    );
};

export default QuotationList;
