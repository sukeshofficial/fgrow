import React from "react";
import { Search, Plus } from "lucide-react";

const DscFilterBar = ({ filters, onFilterChange, onCreateNew }) => {
    return (
        <div className="filter-bar">
            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search client, class, notes..."
                    className="table-search-input"
                    value={filters.search}
                    onChange={(e) => onFilterChange("search", e.target.value)}
                />
            </div>

            <div className="quick-filters">
                <div className="status-toggle">
                    {['all', 'Class 1', 'Class 2', 'Class 3'].map((classType) => (
                        <button
                            key={classType}
                            className={`toggle-btn ${filters.classType === classType ? 'active' : ''}`}
                            onClick={() => onFilterChange("classType", classType)}
                        >
                            {classType}
                        </button>
                    ))}
                </div>

                <button className="create-btn" onClick={onCreateNew}>
                    <Plus size={18} />
                    New DSC
                </button>
            </div>
        </div>
    );
};

export default DscFilterBar;
