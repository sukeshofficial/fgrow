import React from "react";
import { FaSearch, FaPlus, FaFilter } from "react-icons/fa";

const ReceiptFilterBar = ({ filters, onFilterChange, onCreateNew }) => {
    return (
        <div className="filter-bar">
            <div className="search-wrapper">
                <FaSearch className="search-icon" />
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

                <button className="create-btn" onClick={onCreateNew}>
                    <FaPlus />
                    Record Receipt
                </button>
            </div>
        </div>
    );
};

export default ReceiptFilterBar;
