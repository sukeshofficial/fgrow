import { Search, Plus, Filter, BarChart2 } from "lucide-react";

const ReceiptFilterBar = ({ filters, onFilterChange, onCreateNew, onOpenFilters, onViewReport }) => {
    return (
        <div className="filter-bar">
            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search by receipt no or remarks..."
                    className="table-search-input"
                    value={filters.search}
                    onChange={(e) => onFilterChange("search", e.target.value)}
                />
            </div>

            <div className="quick-filters">
                <div className="status-toggle">
                    {['all', 'draft', 'partially_settled', 'settled'].map((status) => (
                        <button
                            key={status}
                            className={`toggle-btn ${filters.status === status ? 'active' : ''}`}
                            onClick={() => onFilterChange("status", status)}
                        >
                            {status.split('_').join(' ').charAt(0).toUpperCase() + status.split('_').join(' ').slice(1)}
                        </button>
                    ))}
                </div>

                <button className="advanced-filter-btn" onClick={onOpenFilters}>
                    <Filter size={18} />
                    Filters
                </button>
                <button className="view-report-btn" onClick={onViewReport}>
                    <BarChart2 size={18} />
                    Report
                </button>

                <button className="create-btn" onClick={onCreateNew}>
                    <Plus size={18} />
                    Record Receipt
                </button>
            </div>
        </div>
    );
};

export default ReceiptFilterBar;
