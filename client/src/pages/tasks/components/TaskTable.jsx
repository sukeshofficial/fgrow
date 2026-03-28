import React from "react";
import { FaTrash, FaEye, FaEdit, FaClock } from "react-icons/fa";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";
import "./TaskTable.css";

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
      <div className="table-container" style={{ padding: '20px 0' }}>
        <TableSkeleton rows={5} columns={7} />
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
                  <div className="task-table-action-buttons">
                    <button className="task-table-action-btn view" title="View Details" onClick={() => onAction("view", task)}>
                      <FaEye /> View
                    </button>
                    <button className="task-table-action-btn edit" title="Edit Task" onClick={() => onAction("edit", task)}>
                      <FaEdit /> Edit
                    </button>
                    <button className="task-table-action-btn delete" title="Delete Task" onClick={() => onDelete(task._id)}>
                      <FaTrash /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
