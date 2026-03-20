import React from "react";
import { FaTrash, FaEye, FaEdit, FaClock } from "react-icons/fa";

const TaskTable = ({ tasks, loading, onAction, onDelete, onStatusChange }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case "completed": return "status-badge active";
      case "pending": return "status-badge inactive";
      case "in_progress": return "status-badge in-progress";
      case "verified": return "status-badge verified";
      case "cancelled": return "status-badge cancelled";
      default: return "status-badge";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high": return "priority-high";
      case "medium": return "priority-medium";
      case "low": return "priority-low";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-loading">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Task Name</th>
            <th>Client</th>
            <th>Service</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th>Status</th>
            <th style={{ textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                No tasks found.
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task._id}>
                <td>
                  <div className="task-info">
                    <span className="task-name" onClick={() => onAction("view", task)} style={{ cursor: "pointer", fontWeight: "600" }}>
                      {task.title}
                    </span>
                  </div>
                </td>
                <td>{task.client?.name || "N/A"}</td>
                <td>{task.service?.name || "N/A"}</td>
                <td>
                  <span className={`priority-tag ${getPriorityClass(task.priority)}`}>
                    {task.priority || "medium"}
                  </span>
                </td>
                <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}</td>
                <td>
                  <span className={getStatusClass(task.status)}>
                    {task.status.replace("_", " ")}
                  </span>
                </td>
                <td style={{ width: "1%", whiteSpace: "nowrap" }}>
                  <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                    <button className="action-btn view" title="View Details" onClick={() => onAction("view", task)}>
                      <FaEye />
                    </button>
                    <button className="action-btn edit" title="Edit Task" onClick={() => onAction("edit", task)}>
                      <FaEdit />
                    </button>
                    <button className="action-btn delete" title="Delete Task" onClick={() => onDelete(task._id)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <style>{`
        .priority-tag {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .priority-high { background: #fee2e2; color: #991b1b; }
        .priority-medium { background: #fef3c7; color: #92400e; }
        .priority-low { background: #f0fdf4; color: #166534; }
        
        .status-badge.in-progress { background: #e0f2fe; color: #075985; }
        .status-badge.verified { background: #dcfce7; color: #166534; }
        .status-badge.cancelled { background: #f1f5f9; color: #475569; }

        .action-buttons { display: flex; gap: 8px;}
        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          transition: color 0.2s;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-btn.view:hover { color: var(--primary-accent); }
        .action-btn.edit:hover { color: var(--primary-blue); }
        .action-btn.delete:hover { color: var(--error-red); }

        .table-loading {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default TaskTable;
