import React from "react";
import { Search, Plus } from "lucide-react";

const DocumentFilterBar = ({ filters, onFilterChange, onCreateNew }) => {
    return (
        <div className="filter-bar">
            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search client, location, doc type..."
                    className="table-search-input"
                    value={filters.search}
                    onChange={(e) => onFilterChange("search", e.target.value)}
                />
            </div>

            <div className="quick-filters">
                <div className="status-toggle">
                    {['all', 'given', 'received'].map((category) => (
                        <button
                            key={category}
                            className={`toggle-btn ${filters.category === category ? 'active' : ''}`}
                            onClick={() => onFilterChange("category", category)}
                        >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                    ))}
                </div>

                <button className="create-btn" onClick={onCreateNew}>
                    <Plus size={18} />
                    New Entry
                </button>
            </div>
        </div>
    );
};

export default DocumentFilterBar;
