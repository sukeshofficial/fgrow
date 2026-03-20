import React from "react";
import { FaSearch, FaPlus } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";

const TaskFilterBar = ({ filters, onFilterChange, onCreateNew, onOpenAdvanced }) => {
  return (
    <div className="filter-bar">
      <div className="search-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          className="table-search-input"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
        />
      </div>

      <div className="quick-filters">
        <div className="status-toggle">
          <button
            className={`toggle-btn ${filters.status === "all" ? "active" : ""}`}
            onClick={() => onFilterChange("status", "all")}
          >
            All
          </button>
          <button
            className={`toggle-btn ${filters.status === "pending" ? "active" : ""}`}
            onClick={() => onFilterChange("status", "pending")}
          >
            Pending
          </button>
          <button
            className={`toggle-btn ${filters.status === "in_progress" ? "active" : ""}`}
            onClick={() => onFilterChange("status", "in_progress")}
          >
            In Progress
          </button>
          <button
            className={`toggle-btn ${filters.status === "completed" ? "active" : ""}`}
            onClick={() => onFilterChange("status", "completed")}
          >
            Completed
          </button>
        </div>

        <button className="advanced-filter-btn" onClick={onOpenAdvanced}>
          <FiFilter />
          Filters
        </button>

        <button className="create-btn" onClick={onCreateNew}>
          <FaPlus />
          New Task
        </button>
      </div>
    </div>
  );
};

export default TaskFilterBar;
