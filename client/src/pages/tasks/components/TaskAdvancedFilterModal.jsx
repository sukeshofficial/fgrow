import React, { useState, useEffect } from "react";
import { listClientsByTenantId } from "../../../api/client.api";
import { listServicesByTenant } from "../../../api/service.api";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { FiX, FiFilter } from "react-icons/fi";
import logger from "../../../utils/logger.js";
import "../../../styles/AdvancedFilters.css";

const TaskAdvancedFilterModal = ({ isOpen, onClose, filters, onApply, onClear }) => {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [clientsResp, servicesResp] = await Promise.all([
            listClientsByTenantId({ limit: 100 }),
            listServicesByTenant()
          ]);
          if (clientsResp.data.success) setClients(clientsResp.data.data.items || clientsResp.data.data);
          if (servicesResp.data.success) setServices(servicesResp.data.data.items || servicesResp.data.data);
        } catch (err) {
          logger.error("TaskAdvancedFilter", "Failed to fetch filter options", err);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="filter-modal-header">
          <h3><FiFilter /> Advanced Filters</h3>
          <button className="filter-close-btn" onClick={onClose}><FiX /></button>
        </div>

        <div className="filter-modal-body">
          <div className="filter-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="filter-field-group">
              <label className="filter-field-label">Priority</label>
              <select
                value={filters.priority || ""}
                onChange={(e) => onApply({ ...filters, priority: e.target.value })}
                className="filter-input-styled"
              >
                <option value="">Any Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Status</label>
              <select
                value={filters.status || "all"}
                onChange={(e) => onApply({ ...filters, status: e.target.value })}
                className="filter-input-styled"
              >
                <option value="all">Any Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Client</label>
              <SearchableDropdown
                options={clients}
                value={filters.client}
                onChange={(val) => onApply({ ...filters, client: val })}
                placeholder="Any Client"
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Service</label>
              <SearchableDropdown
                options={services}
                value={filters.service}
                onChange={(val) => onApply({ ...filters, service: val })}
                placeholder="Any Service"
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Date From</label>
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => onApply({ ...filters, dateFrom: e.target.value })}
                className="filter-input-styled"
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Date To</label>
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => onApply({ ...filters, dateTo: e.target.value })}
                className="filter-input-styled"
              />
            </div>
          </div>
        </div>

        <div className="filter-modal-footer">
          <button className="filter-clear-all" onClick={() => { onClear(); onClose(); }}>Reset Filters</button>
          <div className="filter-footer-btns">
            <button className="filter-btn-secondary" onClick={onClose}>Cancel</button>
            <button className="filter-btn-primary" onClick={onClose}>Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAdvancedFilterModal;
