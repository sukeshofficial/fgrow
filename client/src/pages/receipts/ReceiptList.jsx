import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import ReceiptTable from "./components/ReceiptTable";
import ReceiptFilterBar from "./components/ReceiptFilterBar";
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
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        status: 'all',
        client: "",
        billing_entity: "",
        date_from: "",
        date_to: ""
    });

    const showLoading = useDelayedLoading(loading, 300);

    const fetchReceipts = async (currentFilters, currentPage) => {
        setLoading(true);
        try {
            const activeFilter = currentFilters.status === 'all' ? {} : { status: currentFilters.status };
            const params = {
                page: currentPage,
                limit: pagination.limit,
                search: currentFilters.search,
                client: currentFilters.client,
                billing_entity: currentFilters.billing_entity,
                date_from: currentFilters.date_from,
                date_to: currentFilters.date_to,
                ...activeFilter,
            };

            const resp = await receiptService.listReceipts(params);
            setReceipts(resp.data);
            const meta = resp.pagination;
            setPagination({
                page: meta.page,
                limit: meta.limit,
                total: meta.total,
                total_pages: meta.total_pages
            });
        } catch (e) {
            logger.error("ReceiptList", "Failed to fetch receipts", e);
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetch = useCallback(
        debounce((f, p) => {
            fetchReceipts(f, p);
        }, 500),
        []
    );

    useEffect(() => {
        debouncedFetch(filters, pagination.page);
    }, [filters, pagination.page]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
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
                    />

                    <ReceiptTable receipts={receipts} loading={showLoading} />

                    {!showLoading && receipts.length > 0 && (
                        <div className="pagination">
                            <span className="pagination-info">
                                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                            </span>
                            <div className="pagination-controls">
                                <button
                                    className="page-btn"
                                    disabled={pagination.page === 1}
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                >
                                    &lt;
                                </button>
                                {[...Array(pagination.total_pages || 0)].map((_, i) => (
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
                                    disabled={pagination.page === (pagination.total_pages || 1) || pagination.total_pages === 0}
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
