import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FilterBar from "./components/FilterBar";
import ClientTable from "./components/ClientTable";
import AdvancedFilterModal from "./components/AdvancedFilterModal";
import Sidebar from "../../components/SideBar";
import { listClients } from "../../api/client.api";
import "../../styles/ClientList.css";

const ClientList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: "",
    is_active: 'all',
    group: "",
    type: "",
    tags: [],
    pan: "",
    gstin: ""
  });

  // Debounce helper
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const fetchClients = async (currentFilters, currentPage) => {
    setLoading(true);
    try {
      const activeFilter = currentFilters.is_active === 'all' ? {} : { is_active: currentFilters.is_active };
      const params = {
        page: currentPage,
        limit: pagination.limit,
        search: currentFilters.search,
        ...activeFilter,
        group: currentFilters.group,
        type: currentFilters.type,
        tags: currentFilters.tags,
        pan: currentFilters.pan,
        gstin: currentFilters.gstin
      };
      
      const resp = await listClients(params);
      setClients(resp.data.data);
      setPagination(prev => ({ ...prev, ...resp.data.pagination }));
    } catch (e) {
      console.error("Failed to fetch clients", e);
    } finally {
      setLoading(false);
    }
  };

  // Debounced version of fetch
  const debouncedFetch = useCallback(
    debounce((f, p) => fetchClients(f, p), 500),
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
        <div className="client-list-container">
          <div className="client-list-header">
            <h1 className="client-list-title">Clients</h1>
          </div>

          <FilterBar 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onCreateNew={() => navigate("/clients/create")}
            onOpenAdvanced={() => setIsFilterModalOpen(true)}
          />

          <AdvancedFilterModal 
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            filters={filters}
            onApply={(newFilters) => setFilters(newFilters)}
            onClear={() => setFilters({
              search: "",
              is_active: 'all',
              group: "",
              type: "",
              tags: [],
              pan: "",
              gstin: ""
            })}
          />

          <ClientTable clients={clients} loading={loading} />

          {!loading && clients.length > 0 && (
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

export default ClientList;
