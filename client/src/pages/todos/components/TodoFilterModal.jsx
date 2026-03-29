import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { FiX, FiFilter } from "react-icons/fi";
import "../../../styles/AdvancedFilters.css";

const TodoFilterModal = ({ isOpen, onClose, filters, onApply, onClear, clients, services, staff }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="filter-modal-header">
          <h3><FiFilter /> Advanced Filters</h3>
          <button className="filter-close-btn" onClick={onClose}><FiX /></button>
        </div>

        <div className="filter-modal-body">
          <div className="filter-grid-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div className="filter-field-group">
              <label className="filter-field-label">Assigned To</label>
              <SearchableDropdown
                options={staff}
                value={localFilters.user}
                onChange={(val) => setLocalFilters({ ...localFilters, user: val })}
                placeholder="Select Staff"
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Priority</label>
              <select
                className="filter-input-styled"
                value={localFilters.priority || ""}
                onChange={(e) => setLocalFilters({ ...localFilters, priority: e.target.value })}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Client</label>
              <SearchableDropdown
                options={clients}
                value={localFilters.client}
                onChange={(val) => setLocalFilters({ ...localFilters, client: val })}
                placeholder="Select Client"
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Service</label>
              <SearchableDropdown
                options={services}
                value={localFilters.service}
                onChange={(val) => setLocalFilters({ ...localFilters, service: val })}
                placeholder="Select Service"
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Due From</label>
              <input
                type="date"
                className="filter-input-styled"
                value={localFilters.due_from || ""}
                onChange={(e) => setLocalFilters({ ...localFilters, due_from: e.target.value })}
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Due To</label>
              <input
                type="date"
                className="filter-input-styled"
                value={localFilters.due_to || ""}
                onChange={(e) => setLocalFilters({ ...localFilters, due_to: e.target.value })}
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Status</label>
              <select
                className="filter-input-styled"
                value={localFilters.status || "all"}
                onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
              >
                <option value="all">Any Status</option>
                <option value="new">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="filter-modal-footer">
          <button className="filter-clear-all" onClick={handleClear}>Reset Filters</button>
          <div className="filter-footer-btns">
            <button className="filter-btn-secondary" onClick={onClose}>Cancel</button>
            <button className="filter-btn-primary" onClick={handleApply}>Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoFilterModal;
