import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FilterBar from "./components/FilterBar";
import InvoiceTable from "./components/InvoiceTable";
import AdvancedFilterModal from "./components/AdvancedFilterModal";
import Sidebar from "../../components/SideBar";
import { getInvoices } from "../../features/invoices/invoiceService";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
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
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [filters, setFilters] = useState({
    q: "",
    status: 'all',
    client: "",
    billing_entity: "",
    date_from: "",
    date_to: ""
  });

  const showLoading = useDelayedLoading(loading, 300);

  const fetchInvoices = async (currentFilters, currentPage) => {
    setLoading(true);
    try {
      const activeFilter = currentFilters.status === 'all' ? {} : { status: currentFilters.status };
      const params = {
        page: currentPage,
        per_page: pagination.limit,
        q: currentFilters.q,
        client: currentFilters.client,
        billing_entity: currentFilters.billing_entity,
        date_from: currentFilters.date_from,
        date_to: currentFilters.date_to,
        ...activeFilter,
      };

      const resp = await getInvoices(params);
      setInvoices(resp.data.data);
      const meta = resp.data.meta;
      setPagination({
        page: meta.page,
        limit: meta.per_page,
        total: meta.total,
        total_pages: Math.ceil(meta.total / meta.per_page)
      });
    } catch (e) {
      console.error("Failed to fetch invoices", e);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((f, p) => {
      fetchInvoices(f, p);
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

export default InvoiceList;
