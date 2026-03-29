import React, { useState, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { FiEdit2, FiTrash2, FiCalendar, FiUser, FiPackage, FiBriefcase, FiPlus, FiRefreshCw, FiCheck, FiX, FiMoreHorizontal } from "react-icons/fi";
import { updateTodo } from "../../../api/todo.api";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import logger from "../../../utils/logger.js";

const TodoCard = ({ todo, index, onEdit, onDelete, clients, services, staff, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...todo });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditedData({ ...todo });
  }, [todo]);

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTodo(todo._id, editedData);
      setIsEditing(false);
      if (onSuccess) {
        onSuccess();
      } else {
        logger.warn("TodoCard", "onSuccess is undefined!");
      }
    } catch (err) {
      logger.error("TodoCard", "Failed to update todo", err);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData({ ...todo });
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Draggable draggableId={todo._id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`todo-card-v2 ${snapshot.isDragging ? "dragging" : ""}`}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          onClick={() => onEdit(todo)} /* Open modal on click anywhere on card */
          style={{ ...provided.draggableProps.style, cursor: 'pointer' }}
        >
          {/* Card Top Section */}
          <div className="card-v2-header">
            <div className="header-left">
              <span className={`priority-pill ${todo.priority?.toLowerCase()}`}>{todo.priority}</span>
              <h3 className="card-v2-title">{todo.title}</h3>
            </div>

            <div className="header-right">
              {todo.recurrence?.enabled && <FiRefreshCw className="recurrence-icon" title="Recurring to-do" />}
              <div className="created-by-badge">
                {todo.created_by?.profile_avatar?.secure_url ? (
                  <img src={todo.created_by.profile_avatar.secure_url} alt="" className="avatar-img-v2" style={{ width: 16, height: 16 }} />
                ) : (
                  <FiUser />
                )}
                <span>{todo.created_by?.name || "Member"}</span>
              </div>
            </div>
          </div>

          <div className="card-v2-date">
            Created {formatDate(todo.createdAt)}
          </div>

          {/* Card Body - Pill Rows (Standard CRM Styling) */}
          <div className="card-v2-body">
            <div className="pill-row">
              <span className="pill-label">Details:</span>
              <span className="pill-value">{todo.details || "No details"}</span>
            </div>

            <div className="pill-row">
              <span className="pill-label">Due date:</span>
              <div className="pill-value-with-icon">
                <span className="pill-value">{formatDate(todo.due_date)}</span>
                <FiCalendar className="pill-icon" />
              </div>
            </div>

            <div className="pill-row">
              <span className="pill-label">Service:</span>
              <span className="pill-value">{todo.service?.name || "Not specified"}</span>
            </div>

            <div className="pill-row">
              <span className="pill-label">Client:</span>
              <span className="pill-value">{todo.client?.name || "Not specified"}</span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="card-v2-footer">
            <div className="avatars-section">
              <div className="avatar-stack-todo">
                <div className="avatar-v2" title={todo.user?.name || "Unassigned"}>
                  {todo.user?.profile_avatar?.secure_url ? (
                    <img src={todo.user.profile_avatar.secure_url} alt="" className="avatar-img-v2" />
                  ) : (
                    <FiUser />
                  )}
                </div>
                <button className="add-avatar-btn" onClick={(e) => { e.stopPropagation(); onEdit(todo); }}>
                  <FiPlus />
                </button>
              </div>
            </div>

            <div className="action-buttons-v2">
              <button className="icon-btn primary" onClick={(e) => { e.stopPropagation(); onEdit(todo); }}>
                <FiEdit2 />
              </button>
              <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); onDelete(todo._id); }}>
                <FiTrash2 />
              </button>
              <button className="icon-btn secondary" onClick={(e) => { e.stopPropagation(); onEdit(todo); }} title="Full Edit">
                <FiMoreHorizontal />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TodoCard;
