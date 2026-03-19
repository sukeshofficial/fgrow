import React from "react";
import { FiSearch, FiFilter, FiPlus } from "react-icons/fi";

const FilterBar = ({ 
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
          className="table-search-input" 
          placeholder="Search by name, PAN, mobile..." 
          value={filters.search || ""}
          onChange={(e) => onFilterChange("search", e.target.value)}
        />
      </div>

      <div className="quick-filters">
        <div className="status-toggle">
          <button 
            className={`toggle-btn ${filters.is_active === 'all' || filters.is_active === undefined ? 'active' : ''}`}
            onClick={() => onFilterChange("is_active", 'all')}
          >
            All
          </button>
          <button 
            className={`toggle-btn ${filters.is_active === true ? 'active' : ''}`}
            onClick={() => onFilterChange("is_active", true)}
          >
            Active
          </button>
          <button 
            className={`toggle-btn ${filters.is_active === false ? 'active' : ''}`}
            onClick={() => onFilterChange("is_active", false)}
          >
            Inactive
          </button>
        </div>

        <button className="advanced-filter-btn" onClick={onOpenAdvanced}>
          <FiFilter />
          Filters
        </button>

        <button className="create-btn" onClick={onCreateNew}>
          <FiPlus />
          Create Client
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
