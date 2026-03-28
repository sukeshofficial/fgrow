import React from "react";
import { FiX, FiFilter } from "react-icons/fi";
import "../../../styles/AdvancedFilters.css";

const ServiceAdvancedFilterModal = ({ isOpen, onClose, filters, onApply, onClear }) => {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onApply({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="filter-modal-overlay">
      <div className="filter-modal-container" style={{ maxWidth: '450px' }}>
        <div className="filter-modal-header">
          <h3><FiFilter style={{ marginRight: '8px' }} /> Advanced Filters</h3>
          <button className="filter-close-btn" onClick={onClose}><FiX size={20} /></button>
        </div>
        <div className="filter-modal-body">
          <div className="filter-grid-layout">
            <div className="filter-field-group">
              <label className="filter-field-label">Service Type</label>
              <select
                className="filter-input-styled"
                name="is_recurring"
                value={filters.is_recurring === undefined ? 'all' : filters.is_recurring}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? undefined : e.target.value === 'true';
                  onApply({ ...filters, is_recurring: val });
                }}
              >
                <option value="all">All Types</option>
                <option value="false">One-time</option>
                <option value="true">Recurring</option>
              </select>
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">SAC Code</label>
              <input
                className="filter-input-styled"
                type="text"
                name="sac_code"
                value={filters.sac_code || ""}
                onChange={(e) => onApply({ ...filters, sac_code: e.target.value })}
                placeholder="Filter by SAC..."
              />
            </div>
          </div>
        </div>
        <div className="filter-modal-footer">
          <button className="filter-clear-all" onClick={onClear}>Clear All</button>
          <div className="filter-footer-btns">
            <button className="filter-btn-secondary" onClick={onClose}>Cancel</button>
            <button className="filter-btn-primary" onClick={onClose}>Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceAdvancedFilterModal;
