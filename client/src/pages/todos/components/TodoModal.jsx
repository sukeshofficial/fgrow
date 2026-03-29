import React, { useState, useEffect } from "react";
import { createTodo, updateTodo } from "../../../api/todo.api";
import { listClientsByTenantId, listStaff } from "../../../api/client.api";
import { listServicesByTenant } from "../../../api/service.api";
import { FiX, FiCalendar, FiUser, FiPackage, FiBriefcase, FiRepeat, FiChevronDown, FiChevronUp } from "react-icons/fi";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import logger from "../../../utils/logger.js";

const TodoModal = ({ todo, onClose, onSuccess, clients: initialClients, services: initialServices, staff: initialStaff }) => {
  const [formData, setFormData] = useState({
    title: "",
    details: "",
    priority: "medium",
    status: "new",
    due_date: "",
    user: "",
    client: "",
    service: "",
    recurrence: {
      enabled: false,
      interval: 1,
      unit: "month",
      ends_on: "",
    }
  });

  const [clients, setClients] = useState(initialClients || []);
  const [services, setServices] = useState(initialServices || []);
  const [staff] = useState(initialStaff || []);
  const [loadingData, setLoadingData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch clients and services fresh inside the modal
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingData(true);
      try {
        const [cResp, sResp] = await Promise.all([
          listClientsByTenantId(),
          listServicesByTenant(),
        ]);
        if (cResp.data.success) setClients(cResp.data.data || []);
        if (sResp.data.success) setServices(sResp.data.data || []);
      } catch (err) {
        logger.error("TodoModal", "Failed to fetch dropdown data", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchDropdownData();
  }, []);


  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title || "",
        details: todo.details || "",
        priority: todo.priority || "medium",
        status: todo.status || "new",
        due_date: todo.due_date ? new Date(todo.due_date).toISOString().split('T')[0] : "",
        user: todo.user?._id || todo.user || "",
        client: todo.client?._id || todo.client || "",
        service: todo.service?._id || todo.service || "",
        recurrence: {
          enabled: todo.recurrence?.enabled || false,
          interval: todo.recurrence?.interval || 1,
          unit: todo.recurrence?.unit || "month",
          ends_on: todo.recurrence?.ends_on ? new Date(todo.recurrence.ends_on).toISOString().split('T')[0] : "",
        }
      });
      if (todo.recurrence?.enabled) setShowAdvanced(true);
    }
  }, [todo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("recurrence.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        recurrence: { ...prev.recurrence, [field]: type === "checkbox" ? checked : value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        has_due_date: !!formData.due_date,
        assign_to_user: !!formData.user,
        client: formData.client || null,
        service: formData.service || null,
        user: formData.user || null,
        due_date: formData.due_date || null
      };

      if (!payload.recurrence.enabled) {
        payload.recurrence = { enabled: false };
      }

      if (todo) {
        await updateTodo(todo._id, payload);
      } else {
        await createTodo(payload);
      }
      onSuccess();
    } catch (err) {
      logger.error("TodoModal", "Save failed", err);
      alert(err.response?.data?.message || "Failed to save to-do");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content todo-standard-modal">
        <div className="modal-header">
          <h2>{todo ? "Edit To-do" : "Create New To-do"}</h2>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="standard-label">To-do Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Follow up with client"
                  className="standard-input"
                  autoFocus
                />
              </div>

              <div className="form-group full-width">
                <label className="standard-label">Description</label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  rows="3"
                  placeholder="To-do details and notes..."
                  className="standard-textarea"
                />
              </div>

              <div className="form-group">
                <label className="standard-label"><FiUser /> Assignee</label>
                <SearchableDropdown
                  options={staff}
                  value={formData.user}
                  onChange={(val) => setFormData(prev => ({ ...prev, user: val }))}
                  placeholder="Unassigned"
                />
              </div>

              <div className="form-group">
                <label className="standard-label"><FiCalendar /> Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="standard-input"
                />
              </div>

              <div className="form-group">
                <label className="standard-label">Priority</label>
                <div className="priority-button-group">
                  {["low", "medium", "high"].map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`priority-option ${p} ${formData.priority === p ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="standard-label">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="standard-select">
                  <option value="new">New</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="standard-label"><FiBriefcase /> Client</label>
                <SearchableDropdown
                  options={[{ _id: "", name: "No Client" }, ...clients]}
                  value={formData.client}
                  onChange={(val) => setFormData(prev => ({ ...prev, client: val }))}
                  placeholder="No Client"
                  loading={loadingData}
                />
              </div>

              <div className="form-group">
                <label className="standard-label"><FiPackage /> Service</label>
                <SearchableDropdown
                  options={[{ _id: "", name: "No Service" }, ...services]}
                  value={formData.service}
                  onChange={(val) => setFormData(prev => ({ ...prev, service: val }))}
                  placeholder="No Service"
                  loading={loadingData}
                />
              </div>
            </div>

            <div className="advanced-divider" onClick={() => setShowAdvanced(!showAdvanced)}>
              <span>{showAdvanced ? <FiChevronUp /> : <FiChevronDown />} Recurrence & Advanced Options</span>
            </div>

            {showAdvanced && (
              <div className="advanced-section-content">
                <div className="standard-checkbox-container">
                  <label className="checkbox-flex">
                    <input
                      type="checkbox"
                      name="recurrence.enabled"
                      checked={formData.recurrence.enabled}
                      onChange={handleChange}
                    />
                    <span className="checkbox-text"><FiRepeat /> Enable Recurrence</span>
                  </label>
                </div>

                {formData.recurrence.enabled && (
                  <div className="recurrence-fields-grid">
                    <div className="form-group">
                      <label className="standard-label">Repeat Every</label>
                      <div className="split-input">
                        <input type="number" name="recurrence.interval" value={formData.recurrence.interval} onChange={handleChange} min="1" className="standard-input" />
                        <select name="recurrence.unit" value={formData.recurrence.unit} onChange={handleChange} className="standard-select">
                          <option value="day">Day(s)</option>
                          <option value="week">Week(s)</option>
                          <option value="month">Month(s)</option>
                          <option value="year">Year(s)</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="standard-label">Until Date</label>
                      <input type="date" name="recurrence.ends_on" value={formData.recurrence.ends_on} onChange={handleChange} className="standard-input" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Saving..." : (todo ? "Update To-do" : "Create To-do")}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        :root {
          --primary-accent: #6366f1;
          --primary-hover: #4f46e5;
          --border-color: #e2e8f0;
          --text-main: #1f2937;
          --text-muted: #6b7280;
        }

        .todo-standard-modal {
          max-width: 650px !important;
        }

        .standard-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .standard-input, .standard-select, .standard-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 14px;
          background: #fdfdfd;
          transition: all 0.2s;
        }

        .standard-input:focus, .standard-select:focus, .standard-textarea:focus {
          border-color: var(--primary-accent);
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          background: white;
        }

        .priority-button-group {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          gap: 4px;
        }
        .priority-option {
          flex: 1;
          border: none;
          padding: 8px 0;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: var(--text-muted);
        }
        .priority-option.selected.low { background: white; color: #10b981; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .priority-option.selected.medium { background: white; color: #f59e0b; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .priority-option.selected.high { background: white; color: #ef4444; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

        .advanced-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 16px;
          cursor: pointer;
          color: var(--primary-accent);
          font-weight: 600;
          font-size: 14px;
          user-select: none;
        }
        .advanced-divider span { display: flex; align-items: center; gap: 8px; }

        .advanced-section-content {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px dashed var(--border-color);
          margin-bottom: 20px;
        }

        .checkbox-flex {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .checkbox-flex input { width: 18px; height: 18px; cursor: pointer; }
        .checkbox-text { font-size: 14px; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 6px; }

        .recurrence-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 16px;
        }
        .split-input { display: flex; gap: 8px; }

        @media (max-width: 640px) {
          .form-grid, .recurrence-fields-grid {
            grid-template-columns: 1fr;
          }
          .form-group.full-width {
            grid-column: span 1;
          }
          .modal-content {
            width: 95%;
            margin: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default TodoModal;
