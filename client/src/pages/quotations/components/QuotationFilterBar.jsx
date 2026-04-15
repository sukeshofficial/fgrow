import React from "react";
import { Search, Plus, Filter } from "lucide-react";

const QuotationFilterBar = ({ filters, onFilterChange, onCreateNew, onOpenFilters }) => {
    return (
        <div className="filter-bar">
            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search quotation no, client..."
                    className="table-search-input"
                    value={filters.search}
                    onChange={(e) => onFilterChange("search", e.target.value)}
                />
            </div>

            <div className="quick-filters">
                <div className="status-toggle">
                    {['all', 'pending', 'accepted', 'rejected', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            className={`toggle-btn ${filters.status === status ? 'active' : ''}`}
                            onClick={() => onFilterChange("status", status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                <button className="advanced-filter-btn" onClick={onOpenFilters}>
                    <Filter size={18} />
                    Filters
                </button>


                <button className="create-btn" onClick={onCreateNew}>
                    <Plus size={18} />
                    Create Quotation
                </button>
            </div>
        </div>
    );
};

export default QuotationFilterBar;
