import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar";
import ServiceTable from "./components/ServiceTable";
import ServiceFilterBar from "./components/ServiceFilterBar";
import ServiceAdvancedFilterModal from "./components/ServiceAdvancedFilterModal";
import { listServices, updateService, deleteService } from "../../api/service.api";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import { useModal } from "../../context/ModalContext";
import logger from "../../utils/logger.js";
import "../../styles/ClientList.css"; // Reuse client list styles
import "../../styles/Services.css";

const Services = () => {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useDelayedLoading(loading, 300);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: "",
    is_enabled: 'all',
    is_recurring: undefined,
    sac_code: ""
  });

  // Debounce helper
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const fetchServices = async (currentFilters, currentPage) => {
    setLoading(true);
    try {
      const activeFilter = currentFilters.is_enabled === 'all' ? {} : { is_enabled: currentFilters.is_enabled };
      const params = {
        page: currentPage,
        limit: pagination.limit,
        search: currentFilters.search,
        is_recurring: currentFilters.is_recurring,
        sac_code: currentFilters.sac_code,
        ...activeFilter
      };

      const resp = await listServices(params);
      if (resp.data.success) {
        setServices(resp.data.data);
        setPagination(prev => ({ ...prev, ...resp.data.pagination }));
      }
    } catch (e) {
      logger.error("ServicesPage", "Failed to fetch services", e);
    } finally {
      setLoading(false);
    }
  };

  // Debounced version of fetch
  const debouncedFetch = useCallback(
    debounce((f, p) => fetchServices(f, p), 500),
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

  const handleToggleStatus = async (service) => {
    try {
      const resp = await updateService(service._id, { is_enabled: !service.is_enabled });
      if (resp.data.success) {
        fetchServices(filters, pagination.page);
      }
    } catch (e) {
      logger.error("ServicesPage", "Failed to toggle service status", e);
    }
  };

  const handleDeleteService = async (id) => {
    const confirmed = await showConfirm(
      "Archive Service",
      "Are you sure you want to archive this service? This will hide it from active selections.",
      "delete"
    );

    if (confirmed) {
      try {
        const resp = await deleteService(id);
        if (resp.data.success) {
          fetchServices(filters, pagination.page);
          await showAlert("Archived", "Service has been archived successfully.", "success");
        }
      } catch (e) {
        logger.error("ServicesPage", "Failed to delete service", e);
        await showAlert("Error", "Failed to archive service. Please try again.", "error");
      }
    }
  };

  return (
    <>
      <Sidebar />
      <div className="clients">
        <div className="client-list-container">
          <div className="client-list-header">
            <h1 className="client-list-title">Services</h1>
          </div>

          <ServiceFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onOpenAdvanced={() => setIsFilterModalOpen(true)}
            onCreateNew={() => navigate("/services/create")}
          />

          <ServiceAdvancedFilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            filters={filters}
            onApply={(newFilters) => setFilters(newFilters)}
            onClear={() => setFilters({
              search: "",
              is_enabled: 'all',
              is_recurring: undefined,
              sac_code: ""
            })}
          />

          <ServiceTable
            services={services}
            loading={showLoading}
            onDelete={handleDeleteService}
            onToggleStatus={handleToggleStatus}
          />

          {!showLoading && services.length > 0 && (
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
                  disabled={pagination.page === pagination.total_pages}
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

export default Services;
