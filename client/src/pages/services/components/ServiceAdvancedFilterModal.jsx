import React from "react";
import { FiX } from "react-icons/fi";

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
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Advanced Filters</h2>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Service Type</label>
            <select 
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
          
          <div className="form-group">
            <label>SAC Code</label>
            <input 
              type="text" 
              name="sac_code" 
              value={filters.sac_code || ""} 
              onChange={(e) => onApply({ ...filters, sac_code: e.target.value })}
              placeholder="Filter by SAC..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClear}>Clear All</button>
          <button className="submit-btn" onClick={onClose}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
};

export default ServiceAdvancedFilterModal;
