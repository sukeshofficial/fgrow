import React, { useState, useEffect } from "react";
import { FiX, FiCalendar, FiUser, FiPackage, FiBriefcase, FiAlertCircle } from "react-icons/fi";
import { createTask, updateTask } from "../../../api/task.api";
import { listClientsByTenantId, listStaff } from "../../../api/client.api";
import { listServicesByTenant } from "../../../api/service.api";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { Spinner } from "../../../components/ui/Spinner";

const TaskModal = ({ task, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        client: "",
        service: "",
        users: [],
        is_billable: false,
    });

    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [cResp, sResp, stResp] = await Promise.all([
                    listClientsByTenantId(),
                    listServicesByTenant(),
                    listStaff()
                ]);
                if (cResp.data.success) setClients(cResp.data.data);
                if (sResp.data.success) setServices(sResp.data.data);
                if (stResp.data.success) setStaff(stResp.data.data);
            } catch (err) {
                console.error("Failed to fetch task dependencies", err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchDependencies();
    }, []);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || "",
                description: task.description || "",
                priority: task.priority || "medium",
                due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
                client: task.client?._id || task.client || "",
                service: task.service?._id || task.service || "",
                users: task.users?.map(u => u._id || u) || [],
                is_billable: task.is_billable || false,
            });
        }
    }, [task]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (task) {
                await updateTask(task._id, formData);
            } else {
                await createTask(formData);
            }
            onSuccess();
        } catch (err) {
            console.error("Save failed", err);
            alert(err.response?.data?.message || "Failed to save task");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="modal-overlay">
                <div className="modal-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <Spinner />
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px' }}>
                <div className="modal-header">
                    <h2>{task ? "Edit Task" : "Create New Task"}</h2>
                    <button className="close-btn" onClick={onClose}><FiX /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="modal-label">Task Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="modal-input"
                                    placeholder="e.g. Website Maintenance"
                                    autoFocus
                                />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="modal-label">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="modal-input"
                                    placeholder="Additional task details..."
                                />
                            </div>

                            <div>
                                <label className="modal-label"><FiAlertCircle /> Priority</label>
                                <select name="priority" value={formData.priority} onChange={handleChange} className="modal-input">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="modal-label"><FiCalendar /> Due Date</label>
                                <input
                                    type="date"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    className="modal-input"
                                />
                            </div>

                            <div>
                                <label className="modal-label"><FiBriefcase /> Client</label>
                                <SearchableDropdown
                                    options={clients}
                                    value={formData.client}
                                    onChange={(val) => setFormData(prev => ({ ...prev, client: val }))}
                                    placeholder="Select Client"
                                />
                            </div>

                            <div>
                                <label className="modal-label"><FiPackage /> Service</label>
                                <select name="service" value={formData.service} onChange={handleChange} className="modal-input">
                                    <option value="">No Service</option>
                                    {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="modal-label"><FiUser /> Assignees</label>
                                <SearchableDropdown
                                    options={staff}
                                    value={formData.users}
                                    onChange={(val) => setFormData(prev => ({ ...prev, users: Array.isArray(val) ? val : [val] }))}
                                    placeholder="Assign Staff"
                                    isMulti={true}
                                />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="is_billable"
                                        checked={formData.is_billable}
                                        onChange={handleChange}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span>Billable Task</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="modal-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="modal-btn-primary" disabled={loading}>
                            {loading ? "Saving..." : (task ? "Update Task" : "Create Task")}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
        .modal-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .modal-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .modal-input:focus {
          border-color: var(--primary-accent);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .modal-btn-primary {
          background: var(--primary-accent);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-btn-primary:hover {
          background: var(--primary-hover);
        }

        .modal-btn-secondary {
          background: white;
          border: 1px solid var(--border-color);
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .modal-btn-secondary:hover {
          background: #f8fafc;
        }
      `}</style>
        </div>
    );
};

export default TaskModal;
