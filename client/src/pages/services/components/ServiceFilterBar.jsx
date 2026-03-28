import React from "react";
import { FiSearch, FiFilter, FiPlus } from "react-icons/fi";

const ServiceFilterBar = ({
  filters,
  onFilterChange,
  onOpenAdvanced,
  onCreateNew
}) => {
  return (
    <div className="filter-bar">
      <div className="search-wrapper">
        <FiSearch className="search-icon" />
        <input
          type="text"
          id="service-search"
          name="service-search"
          className="table-search-input"
          placeholder="Search services by name, SAC, description..."
          value={filters.search || ""}
          onChange={(e) => onFilterChange("search", e.target.value)}
        />
      </div>

      <div className="quick-filters">
        <div className="status-toggle">
          <button
            className={`toggle-btn ${filters.is_enabled === 'all' || filters.is_enabled === undefined ? 'active' : ''}`}
            onClick={() => onFilterChange("is_enabled", 'all')}
          >
            All
          </button>
          <button
            className={`toggle-btn ${filters.is_enabled === true ? 'active' : ''}`}
            onClick={() => onFilterChange("is_enabled", true)}
          >
            Enabled
          </button>
          <button
            className={`toggle-btn ${filters.is_enabled === false ? 'active' : ''}`}
            onClick={() => onFilterChange("is_enabled", false)}
          >
            Disabled
          </button>
        </div>

        <button className="filter-btn-secondary" onClick={onOpenAdvanced} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          background: 'white',
          color: 'var(--text-main)',
          fontWeight: '500',
          cursor: 'pointer'
        }}>
          <FiFilter />
          Filters
        </button>

        <button className="create-btn" onClick={onCreateNew}>
          <FiPlus />
          Create Service
        </button>
      </div>
    </div>
  );
};

export default ServiceFilterBar;
