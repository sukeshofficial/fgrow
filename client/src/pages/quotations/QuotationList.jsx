import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import quotationService from "../../features/quotations/quotationService";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import logger from "../../utils/logger.js";
import { Plus, Search, Filter, Eye, MoreHorizontal, Download, Send, FileText, Trash2, Pencil } from "lucide-react";
import "./quotations.css";

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};


const QuotationList = () => {
    const navigate = useNavigate();
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [filters, setFilters] = useState({
        search: "",
        status: 'all',
        date_from: "",
        date_to: ""
    });

    // Debounced search term
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

    const handleDebounceSearch = useCallback(
        debounce((value) => setDebouncedSearch(value), 500),
        []
    );

    /**
     * Fetch quotations using TanStack Query
     */
    const { data, isLoading } = useQuery({
        queryKey: ["quotations", { ...filters, search: debouncedSearch }, pagination.page],
        queryFn: async () => {
            const activeFilter = filters.status === 'all' ? {} : { status: filters.status };
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch,
                date_from: filters.date_from,
                date_to: filters.date_to,
                ...activeFilter,
            };
            const resp = await quotationService.listQuotations(params);
            return resp;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const quotations = data?.data || [];
    const meta = data?.pagination || {};
    const total_pages = meta.total_pages || 0;
    const total = meta.total || 0;

    const showLoading = useDelayedLoading(isLoading, 300);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));

        if (key === 'search') {
            handleDebounceSearch(value);
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };


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
                                {showLoading ? (
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

                    {/* Pagination */}
                    {!showLoading && quotations.length > 0 && (
                        <div className="pagination" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="pagination-info" style={{ fontSize: '14px', color: '#64748b' }}>
                                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, total)} of {total} entries
                            </span>
                            <div className="pagination-controls" style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="page-btn"
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer' }}
                                    disabled={pagination.page === 1}
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                >
                                    &lt;
                                </button>
                                {[...Array(total_pages || 0)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`page-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            background: pagination.page === i + 1 ? '#7c3aed' : 'white',
                                            color: pagination.page === i + 1 ? 'white' : '#1e293b',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handlePageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="page-btn"
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: pagination.page === (total_pages || 1) ? 'not-allowed' : 'pointer' }}
                                    disabled={pagination.page === (total_pages || 1) || total_pages === 0}
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
};

export default QuotationList;
