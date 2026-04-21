import React from "react";
import { Search, Plus } from "lucide-react";

const CollectionFilterBar = ({ filters, onFilterChange, onCreateNew }) => {
    return (
        <div className="filter-bar">
            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search client, task, message..."
                    className="table-search-input"
                    value={filters.search}
                    onChange={(e) => onFilterChange("search", e.target.value)}
                />
            </div>

            <div className="quick-filters">
                <div className="status-toggle">
                    {['all', 'open', 'in_progress', 'closed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            className={`toggle-btn ${filters.status === status ? 'active' : ''}`}
                            onClick={() => onFilterChange("status", status)}
                        >
                            {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
                        </button>
                    ))}
                </div>

                <button className="create-btn" onClick={onCreateNew}>
                    <Plus size={18} />
                    New Request
                </button>
            </div>
        </div>
    );
};

export default CollectionFilterBar;
