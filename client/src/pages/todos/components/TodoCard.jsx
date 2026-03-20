import React, { useState, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { FiEdit2, FiTrash2, FiCalendar, FiUser, FiPackage, FiBriefcase, FiPlus, FiRefreshCw, FiCheck, FiX, FiMoreHorizontal } from "react-icons/fi";
import { updateTodo } from "../../../api/todo.api";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";

const TodoCard = ({ todo, index, onEdit, onDelete, clients, services, staff, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...todo });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log("TodoCard: todo prop updated", todo._id, todo.title);
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
    console.log("TodoCard: saving", todo._id, editedData);
    try {
      await updateTodo(todo._id, editedData);
      console.log("TodoCard: save successful, calling onSuccess");
      setIsEditing(false);
      if (onSuccess) {
        onSuccess();
      } else {
        console.warn("TodoCard: onSuccess is undefined!");
      }
    } catch (err) {
      console.error("Failed to update todo", err);
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
          className={`todo-card-v2 ${snapshot.isDragging ? "dragging" : ""} ${isEditing ? "editing" : ""}`}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
        >
          {/* Card Top Section */}
          <div className="card-v2-header">
            <div className="header-left">
              <span className={`priority-pill ${todo.priority?.toLowerCase()}`}>{todo.priority}</span>
              {isEditing ? (
                <input 
                  className="inline-title-input" 
                  value={editedData.title} 
                  onChange={(e) => handleChange("title", e.target.value)} 
                  autoFocus
                />
              ) : (
                <h3 className="card-v2-title">{todo.title}</h3>
              )}
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
              {isEditing ? (
                <input 
                  className="inline-pill-input" 
                  value={editedData.details || ""} 
                  onChange={(e) => handleChange("details", e.target.value)} 
                />
              ) : (
                <span className="pill-value">{todo.details || "No details"}</span>
              )}
            </div>

            <div className="pill-row">
              <span className="pill-label">Due date:</span>
              {isEditing ? (
                <input 
                  type="date"
                  className="inline-pill-input" 
                  value={editedData.due_date ? new Date(editedData.due_date).toISOString().split('T')[0] : ""} 
                  onChange={(e) => handleChange("due_date", e.target.value)} 
                />
              ) : (
                <div className="pill-value-with-icon">
                  <span className="pill-value">{formatDate(todo.due_date)}</span>
                  <FiCalendar className="pill-icon" />
                </div>
              )}
            </div>

            <div className="pill-row">
              <span className="pill-label">Service:</span>
              {isEditing ? (
                <div style={{ flex: 1 }}>
                  <SearchableDropdown
                    options={services || []}
                    value={editedData.service?._id || editedData.service || ""}
                    onChange={(val) => handleChange("service", val)}
                    placeholder="Not specified"
                  />
                </div>
              ) : (
                <span className="pill-value">{todo.service?.name || "Not specified"}</span>
              )}
            </div>

            <div className="pill-row">
              <span className="pill-label">Client:</span>
              {isEditing ? (
                <div style={{ flex: 1 }}>
                  <SearchableDropdown
                    options={clients || []}
                    value={editedData.client?._id || editedData.client || ""}
                    onChange={(val) => handleChange("client", val)}
                    placeholder="Not specified"
                  />
                </div>
              ) : (
                <span className="pill-value">{todo.client?.name || "Not specified"}</span>
              )}
            </div>
          </div>

          {/* Card Footer */}
          <div className="card-v2-footer">
            <div className="avatars-section">
              <div className="avatar-stack">
                 <div className="avatar-v2" title={todo.user?.name || "Unassigned"}>
                  {todo.user?.profile_avatar?.secure_url ? (
                    <img src={todo.user.profile_avatar.secure_url} alt="" className="avatar-img-v2" />
                  ) : (
                    <FiUser />
                  )}
                </div>
                {isEditing ? (
                  <div style={{ width: 140, marginLeft: 8 }}>
                    <SearchableDropdown
                      options={staff || []}
                      value={editedData.user?._id || editedData.user || ""}
                      onChange={(val) => handleChange("user", val)}
                      placeholder="Assignee"
                    />
                  </div>
                ) : (
                  <button className="add-avatar-btn" onClick={() => setIsEditing(true)}>
                    <FiPlus />
                  </button>
                )}
              </div>
            </div>

            <div className="action-buttons-v2">
              {isEditing ? (
                <>
                  <button className="icon-btn success" onClick={handleSave} disabled={saving}>
                    <FiCheck />
                  </button>
                  <button className="icon-btn" onClick={handleCancel}>
                    <FiX />
                  </button>
                </>
              ) : (
                <>
                  <button className="icon-btn primary" onClick={() => setIsEditing(true)}>
                    <FiEdit2 />
                  </button>
                   <button className="icon-btn danger" onClick={() => onDelete(todo._id)}>
                    <FiTrash2 />
                  </button>
                  <button className="icon-btn secondary" onClick={() => onEdit(todo)} title="Full Edit">
                    <FiMoreHorizontal />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TodoCard;
