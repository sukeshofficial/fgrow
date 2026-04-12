import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
import FilterBar from "./components/FilterBar";
import InvoiceTable from "./components/InvoiceTable";
import AdvancedFilterModal from "./components/AdvancedFilterModal";
import Sidebar from "../../components/SideBar";
import { getInvoices } from "../../features/invoices/invoiceService";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import logger from "../../utils/logger.js";
import "../../styles/InvoiceList.css";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const InvoiceList = () => {
  const navigate = useNavigate();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    q: "",
    status: 'all',
    client: "",
    billing_entity: "",
    date_from: "",
    date_to: ""
  });

  // Debounced search term to avoid excessive API calls while typing
  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  const handleDebounceSearch = useCallback(
    debounce((value) => setDebouncedQ(value), 500),
    []
  );

  /**
   * Fetch invoices using TanStack Query
   */
  const { data, isLoading } = useQuery({
    queryKey: ["invoices", { ...filters, q: debouncedQ }, pagination.page],
    queryFn: async () => {
      const activeFilter = filters.status === 'all' ? {} : { status: filters.status };
      const params = {
        page: pagination.page,
        per_page: pagination.limit,
        q: debouncedQ,
        client: filters.client,
        billing_entity: filters.billing_entity,
        date_from: filters.date_from,
        date_to: filters.date_to,
        ...activeFilter,
      };
      const resp = await getInvoices(params);
      return resp.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const invoices = data?.data || [];
  const meta = data?.meta || {};
  const total_pages = Math.ceil((meta.total || 0) / (meta.per_page || 10));

  const showLoading = useDelayedLoading(isLoading, 300);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));

    if (key === 'q') {
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
        <div className="invoice-list-container">
          <div className="invoice-list-header">
            <h1 className="invoice-list-title">Invoices</h1>
          </div>

          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onCreateNew={() => navigate("/finance/invoices/create")}
            onOpenAdvanced={() => setIsFilterModalOpen(true)}
          />

          <AdvancedFilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            filters={filters}
            onApply={(newFilters) => {
              setFilters(newFilters);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            onClear={() => setFilters({
              q: "",
              status: 'all',
              client: "",
              billing_entity: "",
              date_from: "",
              date_to: ""
            })}
          />

          <InvoiceTable invoices={invoices} loading={showLoading} />

          {!showLoading && invoices.length > 0 && (
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

export default InvoiceList;
