import React from "react";
import { Search, Plus, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ExpenseFilterBar = ({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    onAddNew,
    onOpenFilters
}) => {
    const navigate = useNavigate();

    const statuses = [
        { id: 'all', label: 'All' },
        { id: 'unbilled', label: 'Unbilled' },
        { id: 'billed', label: 'Billed' },
        { id: 'partially_billed', label: 'Partial' }
    ];

    return (
        <div className="filter-bar">
            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search by expense #, client, notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="table-search-input"
                />
            </div>

            <div className="quick-filters">
                <div className="status-toggle">
                    {statuses.map((status) => (
                        <button
                            key={status.id}
                            className={`toggle-btn ${statusFilter === status.id ? "active" : ""}`}
                            onClick={() => setStatusFilter(status.id)}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>

                <button className="advanced-filter-btn" onClick={onOpenFilters}>
                    <Filter size={18} />
                    Filters
                </button>


                <button
                    className="create-btn"
                    onClick={onAddNew || (() => navigate("/finance/expenses/create"))}
                >
                    <Plus size={18} /> Create Expense
                </button>
            </div>
        </div>
    );
};

export default ExpenseFilterBar;
