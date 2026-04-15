import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import QuotationFilterBar from "./components/QuotationFilterBar";
import QuotationAdvancedFilterModal from "./components/QuotationAdvancedFilterModal";
import quotationService from "../../features/quotations/quotationService";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import logger from "../../utils/logger.js";
import { Eye, Pencil } from "lucide-react";
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
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [filters, setFilters] = useState({
        search: "",
        status: 'all',
        client: "",
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
            const { search, status, client, date_from, date_to } = filters;
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch || undefined,
                client: client || undefined,
                date_from: date_from || undefined,
                date_to: date_to || undefined,
            };
            if (status && status !== 'all') {
                params.status = status;
            }
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


    return (
        <>
            <Sidebar />
            <div className="clients">
                <div className="quotation-list-container">
                    <div className="quotation-list-header">
                        <div>
                            <h1 className="quotation-list-title">Quotations</h1>
                            <p className="quotation-list-subtitle">Manage and track your business quotations</p>
                        </div>
                    </div>

                    <QuotationFilterBar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onCreateNew={() => navigate("/finance/quotations/create")}
                        onOpenFilters={() => setIsFilterModalOpen(true)}
                    />

                    <QuotationAdvancedFilterModal
                        isOpen={isFilterModalOpen}
                        onClose={() => setIsFilterModalOpen(false)}
                        filters={filters}
                        onApply={(newFilters) => {
                            setFilters(newFilters);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        onClear={() => {
                            setFilters({
                                search: "",
                                status: 'all',
                                client: "",
                                date_from: "",
                                date_to: ""
                            });
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    />

                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Quotation NO</th>
                                    <th>Client</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {showLoading ? (
                                    <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading quotations...</td></tr>
                                ) : quotations.length === 0 ? (
                                    <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No quotations found.</td></tr>
                                ) : (

                                    quotations.map((q) => (
                                        <tr key={q._id}>
                                            <td style={{ fontWeight: '700' }}>
                                                <span
                                                    onClick={() => navigate(`/finance/quotations/${q._id}`)}
                                                    className="clickable-number"
                                                    style={{ color: 'var(--primary-accent)', cursor: 'pointer' }}
                                                >
                                                    {q.quotation_no}
                                                </span>
                                            </td>
                                            <td style={{ color: '#475569' }}>{q.client?.name || '-'}</td>
                                            <td style={{ color: '#64748b', fontSize: '13px' }}>{new Date(q.date).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: '700', color: '#1e293b' }}>₹{q.total_amount?.toLocaleString()}</td>
                                            <td>
                                                <span className={`status-pill ${q.status || 'pending'}`}>{q.status || 'pending'}</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
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
                        <div className="pagination">
                            <span className="pagination-info">
                                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, total)} of {total} entries
                            </span>
                            <div className="pagination-controls">
                                <button
                                    className="page-btn"
                                    disabled={pagination.page === 1}
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                >
                                    &lt;
                                </button>
                                {[...Array(total_pages || 0)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`page-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                                        onClick={() => handlePageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="page-btn"
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
