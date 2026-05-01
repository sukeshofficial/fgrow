import { FiSearch, FiFilter, FiPlus, FiBarChart2 } from "react-icons/fi";

const FilterBar = ({
  filters,
  onFilterChange,
  onOpenAdvanced,
  onCreateNew,
  onOpenReport
}) => {
  return (
    <div className="filter-bar">
      <div className="search-wrapper">
        <FiSearch className="search-icon" />
        <input
          type="text"
          className="table-search-input"
          placeholder="Search by invoice no, client..."
          value={filters.q || ""}
          onChange={(e) => onFilterChange("q", e.target.value)}
        />
      </div>

      <div className="quick-filters">
        <div className="status-toggle">
          <button
            className={`toggle-btn ${filters.status === 'all' || !filters.status ? 'active' : ''}`}
            onClick={() => onFilterChange("status", 'all')}
          >
            All
          </button>
          <button
            className={`toggle-btn ${filters.status === 'draft' ? 'active' : ''}`}
            onClick={() => onFilterChange("status", 'draft')}
          >
            Draft
          </button>
          <button
            className={`toggle-btn ${filters.status === 'sent' ? 'active' : ''}`}
            onClick={() => onFilterChange("status", 'sent')}
          >
            Sent
          </button>
          <button
            className={`toggle-btn ${filters.status === 'partially_paid' ? 'active' : ''}`}
            onClick={() => onFilterChange("status", 'partially_paid')}
          >
            Partial
          </button>
          <button
            className={`toggle-btn ${filters.status === 'paid' ? 'active' : ''}`}
            onClick={() => onFilterChange("status", 'paid')}
          >
            Paid
          </button>
        </div>

        <button className="advanced-filter-btn" onClick={onOpenAdvanced}>
          <FiFilter />
          Filters
        </button>

        <button className="view-report-btn" onClick={onOpenReport}>
          <FiBarChart2 />
          Report
        </button>

        <button className="create-btn" onClick={onCreateNew}>
          <FiPlus />
          Create Invoice
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
