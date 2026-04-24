import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import FilterBar from "./components/FilterBar";
import InvoiceTable from "./components/InvoiceTable";
import AdvancedFilterModal from "./components/AdvancedFilterModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import Sidebar from "../../components/SideBar";
import { getInvoices, getInvoiceStats, deleteInvoice, bulkDeleteInvoices } from "../../features/invoices/invoiceService";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import logger from "../../utils/logger.js";
import { IndianRupee, FileText, TrendingUp, Trash2 } from "lucide-react";
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
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      if (ids.length === 1) {
        return await deleteInvoice(ids[0]);
      } else {
        return await bulkDeleteInvoices(ids);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats-summary"] });
      setSelectedInvoices([]);
      setIsDeleteModalOpen(false);
      logger.info("Invoices deleted successfully");
    },
    onError: (err) => {
      logger.error("Error deleting invoices", err);
      alert(err.message || "Failed to delete invoices");
    }
  });

  const handleDelete = useCallback((ids) => {
    setSelectedInvoices(Array.isArray(ids) ? ids : [ids]);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = () => {
    deleteMutation.mutate(selectedInvoices);
  };
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || 'all',
    client: searchParams.get("client") || "",
    billing_entity: searchParams.get("billing_entity") || "",
    date_from: searchParams.get("date_from") || "",
    date_to: searchParams.get("date_to") || ""
  });

  // Debounced search term to avoid excessive API calls while typing
  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  const handleDebounceSearch = useCallback(
    debounce((value) => setDebouncedQ(value), 500),
    []
  );

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || 'all';
    const client = searchParams.get("client") || "";
    const billing_entity = searchParams.get("billing_entity") || "";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";

    setFilters({ q, status, client, billing_entity, date_from, date_to });
    setDebouncedQ(q);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchParams]);

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

  const { data: statsData } = useQuery({
    queryKey: ["invoice-stats-summary"],
    queryFn: async () => {
      const resp = await getInvoiceStats();
      return resp.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const stats = statsData?.summary || { totalRevenue: 0, invoiceCount: 0 };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h1 className="invoice-list-title">Invoices</h1>
              {searchParams.get("fromReport") === "true" && (
                <div className="report-indicator">
                  <span>Applied from Report</span>
                  <button onClick={() => navigate("/finance/invoices")} title="Clear report filters">×</button>
                </div>
              )}
            </div>
          </div>

          <div className="invoice-stats-summary">
            <div className="summary-card">
              <div className="summary-card-header">
                <div className="summary-icon revenue"><IndianRupee size={16} /></div>
                <span className="summary-label">Total Revenue</span>
              </div>
              <span className="summary-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-card">
              <div className="summary-card-header">
                <div className="summary-icon count"><FileText size={16} /></div>
                <span className="summary-label">Invoice Count</span>
              </div>
              <span className="summary-value">{stats.invoiceCount}</span>
            </div>
            <div className="summary-card">
              <div className="summary-card-header">
                <div className="summary-icon avg"><TrendingUp size={16} /></div>
                <span className="summary-label">Avg. Value</span>
              </div>
              <span className="summary-value">₹{Math.round(stats.totalRevenue / (stats.invoiceCount || 1)).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onCreateNew={() => navigate("/finance/invoices/create")}
            onOpenAdvanced={() => setIsFilterModalOpen(true)}
            onOpenReport={() => navigate("/finance/invoices/report")}
          />

          {selectedInvoices.length > 0 && (
            <div className="bulk-actions-bar">
              <span className="selected-count">
                {selectedInvoices.length} {selectedInvoices.length === 1 ? 'invoice' : 'invoices'} selected
              </span>
              <button
                className="bulk-delete-btn"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={16} /> Delete Selected
              </button>
            </div>
          )}

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

          <InvoiceTable
            invoices={invoices}
            loading={showLoading}
            selectedIds={selectedInvoices}
            onSelect={(id) => {
              setSelectedInvoices(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
              );
            }}
            onSelectAll={() => {
              if (selectedInvoices.length === invoices.length && invoices.length > 0) {
                setSelectedInvoices([]);
              } else {
                setSelectedInvoices(invoices.map(inv => inv._id));
              }
            }}
            onDelete={handleDelete}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDelete}
            count={selectedInvoices.length}
            loading={deleteMutation.isPending}
          />

          {!showLoading && invoices.length > 0 && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, meta.total || 0)} of {meta.total || 0} entries
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
