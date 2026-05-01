import React, { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import ReceiptTable from "./components/ReceiptTable";
import ReceiptFilterBar from "./components/ReceiptFilterBar";
import ReceiptAdvancedFilterModal from "./components/ReceiptAdvancedFilterModal";
import receiptService from "../../features/receipts/receiptService";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import { IndianRupee } from "lucide-react";
import logger from "../../utils/logger.js";
import "../../styles/ReceiptList.css";

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const ReceiptList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [filters, setFilters] = useState({
        search: searchParams.get("search") || "",
        status: searchParams.get("status") || 'all',
        client: searchParams.get("client") || "",
        billing_entity: searchParams.get("billing_entity") || "",
        date_from: searchParams.get("date_from") || "",
        date_to: searchParams.get("date_to") || ""
    });

    // Debounced search term
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

    const handleDebounceSearch = useCallback(
        debounce((value) => setDebouncedSearch(value), 500),
        []
    );

    useEffect(() => {
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || 'all';
        const client = searchParams.get("client") || "";
        const billing_entity = searchParams.get("billing_entity") || "";
        const date_from = searchParams.get("date_from") || "";
        const date_to = searchParams.get("date_to") || "";

        setFilters({ search, status, client, billing_entity, date_from, date_to });
        setDebouncedSearch(search);
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [searchParams]);

    /**
     * Fetch receipts using TanStack Query
     */
    const { data, isLoading } = useQuery({
        queryKey: ["receipts", { ...filters, search: debouncedSearch }, pagination.page],
        queryFn: async () => {
            const { search, status, client, billing_entity, date_from, date_to } = filters;
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch || undefined,
                client: client || undefined,
                billing_entity: billing_entity || undefined,
                date_from: date_from || undefined,
                date_to: date_to || undefined,
            };
            if (status && status !== 'all') {
                params.status = status;
            }
            const resp = await receiptService.listReceipts(params);
            return resp;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const receipts = data?.data || [];
    const meta = data?.pagination || {};
    const total_pages = meta.total_pages || 0;
    const total = meta.total || 0;

    const { data: statsData } = useQuery({
        queryKey: ["receipt-stats-summary"],
        queryFn: async () => {
            const resp = await receiptService.getReceiptStats();
            return resp.data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const stats = statsData?.summary || { totalReceived: 0, tdsAmount: 0, totalAmount: 0 };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

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
                <div className="receipt-list-container">
                    <div className="receipt-list-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <h1 className="receipt-list-title">Receipts</h1>
                            {searchParams.get("fromReport") === "true" && (
                                <div className="report-indicator">
                                    <span>Applied from Report</span>
                                    <button onClick={() => navigate("/finance/receipts")} title="Clear report filters">×</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="list-metric-cards">
                        <div className="list-metric-card">
                            <span className="l-m-label">Total Received</span>
                            <span className="l-m-value">{formatCurrency(stats.totalReceived)}</span>
                        </div>
                        <div className="list-metric-card">
                            <span className="l-m-label">TDS Deducted</span>
                            <span className="l-m-value">{formatCurrency(stats.tdsAmount)}</span>
                        </div>
                        <div className="list-metric-card">
                            <span className="l-m-label">Net Applied</span>
                            <span className="l-m-value">{formatCurrency(stats.totalAmount)}</span>
                        </div>
                        <div className="list-metric-card">
                            <span className="l-m-label">Total Receipts</span>
                            <span className="l-m-value">{total}</span>
                        </div>
                    </div>

                    <ReceiptFilterBar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onCreateNew={() => navigate("/finance/receipts/create")}
                        onOpenFilters={() => setIsFilterModalOpen(true)}
                        onViewReport={() => navigate("/finance/receipts/report")}
                    />

                    <ReceiptAdvancedFilterModal
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
                                billing_entity: "",
                                date_from: "",
                                date_to: ""
                            });
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    />

                    <ReceiptTable receipts={receipts} loading={showLoading} />

                    {!showLoading && receipts.length > 0 && (
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

export default ReceiptList;
