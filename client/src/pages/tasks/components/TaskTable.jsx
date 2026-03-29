import React, { useState, useRef, useEffect } from "react";
import { FaTrash, FaEye, FaEdit, FaClock, FaEllipsisV } from "react-icons/fa";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";
import "./TaskTable.css";

const TaskTable = ({ tasks, loading, onAction, onDelete, onStatusChange }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  // Popover State for Assigned Users
  const [activePopover, setActivePopover] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setActivePopover(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", () => {
      setActiveDropdown(null);
      setActivePopover(null);
    }, true);
    window.addEventListener("resize", () => {
      setActiveDropdown(null);
      setActivePopover(null);
    });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", () => {
        setActiveDropdown(null);
        setActivePopover(null);
      }, true);
      window.removeEventListener("resize", () => {
        setActiveDropdown(null);
        setActivePopover(null);
      });
    };
  }, []);

  const toggleDropdown = (e, id) => {
    e.stopPropagation();
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX
      });
      setActiveDropdown(id);
    }
  };

  const handlePopoverOpen = (e, task) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 260;
    let left = rect.left + window.scrollX;

    // Adjust if too close to right edge
    if (left + popoverWidth > window.innerWidth) {
      left = window.innerWidth - popoverWidth - 20;
    }

    setPopoverPos({
      top: rect.bottom + window.scrollY + 8,
      left: left
    });
    setActivePopover(task);
  };

  const renderAvatars = (task) => {
    const users = task.users || [];
    if (users.length === 0) return <span style={{ color: '#94a3b8', fontSize: '12px' }}>Unassigned</span>;

    const displayUsers = users.slice(0, 3);
    const remaining = users.length - 3;

    return (
      <div className="assigned-users-cell" onClick={(e) => handlePopoverOpen(e, task)}>
        <div className="avatar-stack">
          {remaining > 0 && (
            <div className="avatar-circle avatar-more">
              +{remaining}
            </div>
          )}
          {[...displayUsers].reverse().map((user) => (
            <div key={user._id} className="avatar-circle" title={user.name}>
              {user.profile_avatar?.secure_url || user.photo?.secure_url ? (
                <img src={user.profile_avatar?.secure_url || user.photo?.secure_url} alt={user.name} />
              ) : (
                (user.name || user.username || "?").charAt(0).toUpperCase()
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

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
        <TableSkeleton rows={5} columns={8} />
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Task Name</th>
            <th style={{ textAlign: "center" }}>Assigned</th>
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
              <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
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
                <td>{renderAvatars(task)}</td>
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
                  {/* Desktop Actions */}
                  <div className="task-table-action-buttons desktop-only">
                    <button className="task-table-action-btn view" title="View Details" onClick={() => onAction("view", task)}>
                      <FaEye /> View
                    </button>
                    <button className="task-table-action-btn edit" title="Edit Task" onClick={() => onAction("edit", task)}>
                      <FaEdit /> Edit
                    </button>
                    <button className="task-table-action-btn delete" title="Delete Task" onClick={() => onDelete(task)}>
                      <FaTrash /> Delete
                    </button>
                  </div>

                  {/* Mobile Actions Dropdown */}
                  <div className="mobile-only action-dropdown-container">
                    <button className="more-actions-btn" onClick={(e) => toggleDropdown(e, task._id)}>
                      <FaEllipsisV />
                    </button>
                    {activeDropdown === task._id && (
                      <div
                        className="action-dropdown-menu flyout"
                        ref={dropdownRef}
                        style={{
                          position: 'fixed',
                          top: dropdownPos.top - window.scrollY,
                          left: dropdownPos.left - window.scrollX,
                          transform: 'translateX(-100%)',
                          marginTop: '8px'
                        }}
                      >
                        <button onClick={() => { onAction("view", task); setActiveDropdown(null); }}>
                          <FaEye /> View Details
                        </button>
                        <button onClick={() => { onAction("edit", task); setActiveDropdown(null); }}>
                          <FaEdit /> Edit Task
                        </button>
                        <button className="delete-action" onClick={() => { onDelete(task); setActiveDropdown(null); }}>
                          <FaTrash /> Delete Task
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Assigned Users Popover */}
      {activePopover && (
        <div
          className="users-popover"
          ref={popoverRef}
          style={{
            top: popoverPos.top - window.scrollY,
            left: popoverPos.left - window.scrollX
          }}
        >
          <div className="popover-header">
            <h4>Assigned Team</h4>
          </div>
          <div className="popover-user-list">
            {activePopover.users.map(user => (
              <div key={user._id} className="popover-user-item">
                <div className="popover-avatar">
                  {user.profile_avatar?.secure_url || user.photo?.secure_url ? (
                    <img src={user.profile_avatar?.secure_url || user.photo?.secure_url} alt={user.name} />
                  ) : (
                    (user.name || user.username || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="popover-user-info">
                  <span className="popover-user-name">{user.name}</span>
                  <span className="popover-user-email">{user.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTable;
