import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import ReceiptTable from "./components/ReceiptTable";
import ReceiptFilterBar from "./components/ReceiptFilterBar";
import ReceiptAdvancedFilterModal from "./components/ReceiptAdvancedFilterModal";
import receiptService from "../../features/receipts/receiptService";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
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
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [filters, setFilters] = useState({
        search: "",
        status: 'all',
        client: "",
        billing_entity: "",
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
                        <h1 className="receipt-list-title">Receipts</h1>
                    </div>

                    <ReceiptFilterBar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onCreateNew={() => navigate("/finance/receipts/create")}
                        onOpenFilters={() => setIsFilterModalOpen(true)}
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
