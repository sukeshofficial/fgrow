import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SideBar from "../../components/SideBar";
import StatusDropdown from "../../components/tasks/StatusDropdown";
import {
  getTask,
  updateTaskStatus,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  startTimelog,
  stopTimelog,
  addTimelog,
  getTaskActivities
} from "../../api/task.api.js";
import {
  FaCheckCircle,
  FaRegCircle,
  FaTrash,
  FaPlay,
  FaStop,
  FaPlus,
  FaHistory,
  FaClock,
  FaArrowLeft,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaUsers,
  FaLock
} from "react-icons/fa";
import "./components/TaskDetails.css";
import { Spinner } from "../../components/ui/Spinner";
import logger from "../../utils/logger.js";
import { useAuth } from "../../hooks/useAuth.js";

/**
 * Relative time helper
 */
const getRelativeTime = (date) => {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

/**
 * Avatar helper — reused from TaskTable logic
 */
const UserAvatar = ({ user, size = 32 }) => {
  const imgSrc = user?.profile_avatar?.secure_url || user?.photo?.secure_url;
  return (
    <div
      className="td-avatar-circle"
      title={user?.name || "Unknown"}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={user.name} />
      ) : (
        (user?.name || user?.username || "?").charAt(0).toUpperCase()
      )}
    </div>
  );
};

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTimelogId, setActiveTimelogId] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  const fetchTaskDetails = useCallback(async () => {
    try {
      const [taskResp, activitiesResp] = await Promise.all([
        getTask(id),
        getTaskActivities(id)
      ]);
      if (taskResp.data.success) {
        setTask(taskResp.data.data);
        const activeLog = taskResp.data.data.timelogs?.find(log => !log.end_time);
        if (activeLog) {
          setIsTimerRunning(true);
          setActiveTimelogId(activeLog._id);
        } else {
          setIsTimerRunning(false);
          setActiveTimelogId(null);
        }
      }
      if (activitiesResp.data.success) {
        setActivities(activitiesResp.data.data);
      }
    } catch (err) {
      logger.error("TaskDetails", "Failed to fetch task details", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  /**
   * Determine if current user can perform actions:
   * - Assigned to the task, OR
   * - Is tenant owner or super admin
   */
  const isReadOnly = useMemo(() => {
    if (!task || !user) return true;
    if (user.platform_role === "super_admin") return false;
    if (user.tenant_role === "owner") return false;
    const assignedIds = task.users?.map(u => u._id?.toString() || u.toString()) || [];
    return !assignedIds.includes(user._id?.toString() || user.id);
  }, [task, user]);

  const handleStatusChange = async (newStatus) => {
    if (isReadOnly) return;
    try {
      const resp = await updateTaskStatus(id, newStatus);
      if (resp.data.success) fetchTaskDetails();
    } catch (err) {
      logger.error("TaskDetails", "Status update failed", err);
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim() || isReadOnly) return;
    try {
      await addChecklistItem(id, { title: newChecklistItem });
      setNewChecklistItem("");
      fetchTaskDetails();
    } catch (err) {
      logger.error("TaskDetails", "Checklist add failed", err);
    }
  };

  const handleToggleChecklist = async (idx, isDone) => {
    if (isReadOnly) return;
    try {
      await updateChecklistItem(id, idx, { is_done: !isDone });
      fetchTaskDetails();
    } catch (err) {
      logger.error("TaskDetails", "Checklist toggle failed", err);
    }
  };

  const handleDeleteChecklist = async (idx) => {
    if (isReadOnly) return;
    try {
      await deleteChecklistItem(id, idx);
      fetchTaskDetails();
    } catch (err) {
      logger.error("TaskDetails", "Checklist delete failed", err);
    }
  };

  const handleToggleTimer = async () => {
    if (isReadOnly) return;
    try {
      if (isTimerRunning) {
        await stopTimelog(id, activeTimelogId);
      } else {
        await startTimelog(id);
      }
      fetchTaskDetails();
    } catch (err) {
      logger.error("TaskDetails", "Timer toggle failed", err);
    }
  };

  const totalTime = useMemo(() => {
    if (!task?.timelogs) return 0;
    return task.timelogs.reduce((acc, log) => acc + (log.duration_minutes || 0), 0);
  }, [task]);

  const processedActivities = useMemo(() => {
    if (!activities) return [];
    return activities.filter((activity, index, self) => {
      if (index === 0) return true;
      const prev = self[index - 1];
      if (activity.activity_type === "status_changed" && prev.activity_type === "status_changed") {
        return false;
      }
      return true;
    });
  }, [activities]);

  if (loading) {
    return (
      <div className="loading" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spinner />
      </div>
    );
  }
  if (!task) return <div className="error">Task not found</div>;

  const assignedUsers = task.users || [];
  const displayUsers = assignedUsers.slice(0, 3);
  const remaining = assignedUsers.length - 3;

  return (
    <>
      <SideBar />
      <div className="clients">
        <div className="task-details-container">
          {/* Header Navigation */}
          <Link to="/tasks" className="back-link">
            <FaArrowLeft size={12} /> Back to Tasks
          </Link>

          {/* Main Header Section */}
          <div className="task-header-section">
            <div className="task-header-main">
              <div className="task-title-area">
                <div className="td-title-row">
                  <h1>{task.title}</h1>
                  
                </div>
                {task.status === "completed" && task.completed_at && (
                  <div className="task-completion-badge">
                    <FaCheckCircle /> Completed on {new Date(task.completed_at).toLocaleDateString()}
                  </div>
                )}
                <p className="task-description">{task.description || "No description provided."}</p>

                {/* Read-only notice for non-assigned users */}
                {isReadOnly && (
                  <div className="td-readonly-notice">
                    <FaLock size={12} />
                    <span>You are not assigned to this task. Actions are restricted.</span>
                  </div>
                )}
              </div>

              <div className="task-header-actions">
                <StatusDropdown
                  value={task.status}
                  onChange={handleStatusChange}
                  disabled={isReadOnly}
                />
                {!isReadOnly && (
                  <button
                    onClick={handleToggleTimer}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isTimerRunning ? '#ef4444' : 'var(--primary-accent)',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    {isTimerRunning ? <FaStop /> : <FaPlay />}
                    {isTimerRunning ? "Stop Session" : "Start Session"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="detail-layout-grid">
            <div className="main-detail-column">
              {/* Checklist Section */}
              <div className="section-card">
                <h3 className="section-title">
                  <FaCheckCircle color="var(--primary-accent)" /> Checklist
                </h3>

                <div className="checklist-items-simple">
                  {task.checklist?.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '14px', padding: '12px 0' }}>No tasks in checklist.</p>
                  ) : (
                    task.checklist.map((item, idx) => (
                      <div key={idx} className="checklist-item-row">
                        <div
                          className={`checklist-checkbox ${item.is_done ? 'checked' : ''} ${isReadOnly ? 'readonly' : ''}`}
                          onClick={() => !isReadOnly && handleToggleChecklist(idx, item.is_done)}
                          style={{ cursor: isReadOnly ? 'default' : 'pointer' }}
                        >
                          {item.is_done ? <FaCheckCircle /> : <FaRegCircle />}
                        </div>
                        <div className={`checklist-text ${item.is_done ? 'checked' : ''}`}>
                          {item.title}
                        </div>
                        {!isReadOnly && (
                          <button onClick={() => handleDeleteChecklist(idx)} className="checklist-delete-btn">
                            <FaTrash size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {!isReadOnly && (
                  <form onSubmit={handleAddChecklist} style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="Add a new checklist item..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                    />
                    <button type="submit" disabled={!newChecklistItem.trim()} style={{
                      background: newChecklistItem.trim() ? 'var(--primary-accent)' : '#cbd5e1',
                      color: 'white',
                      border: 'none',
                      padding: '0 20px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      <FaPlus size={12} />
                    </button>
                  </form>
                )}
              </div>

              {/* Time Logs Section */}
              <div className="section-card">
                <h3 className="section-title">
                  <FaClock color="var(--primary-accent)" /> Time Tracking
                </h3>

                <div className="timelogs-summary" onClick={() => setShowLogs(!showLogs)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="total-time-badge">{totalTime} minutes logged</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {showLogs ? "Click to hide details" : "Click to view logs"}
                    </span>
                  </div>
                  {showLogs ? <FaChevronUp size={12} color="#94a3b8" /> : <FaChevronDown size={12} color="#94a3b8" />}
                </div>

                {showLogs && (
                  <div className="timelogs-table-container">
                    <table className="timelogs-table-compact">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Started</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {task.timelogs?.map((log, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '600' }}>{log.user?.name || "Member"}</td>
                            <td>{new Date(log.start_time).toLocaleDateString()}</td>
                            <td>{log.end_time ? `${log.duration_minutes || 0}m` : <span style={{ color: 'var(--primary-accent)', fontWeight: '700' }}>Active</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="sidebar-detail-column">
              {/* Assigned Team Section */}
              {assignedUsers.length > 0 && (
                <div className="section-card">
                  <h3 className="section-title">
                    <FaUsers color="#64748b" size={16} /> Assigned Team
                  </h3>
                  <div className="td-team-list">
                    {assignedUsers.map((u) => (
                      <div key={u._id} className="td-team-member">
                        <UserAvatar user={u} size={36} />
                        <div className="td-team-member-info">
                          <span className="td-team-member-name">{u.name || u.username}</span>
                          <span className="td-team-member-email">{u.email}</span>
                        </div>
                        {u._id?.toString() === (user?._id?.toString() || user?.id) && (
                          <span className="td-you-badge">You</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Section */}
              <div className="section-card">
                <h3 className="section-title">
                  <FaHistory color="#64748b" size={16} /> Recent Activity
                </h3>
                <div className="activity-list-compact">
                  {processedActivities.slice(0, 10).map((activity) => {
                    if (activity.activity_type === "status_changed") {
                      return (
                        <div key={activity._id} className="activity-item-simple">
                          <div className="activity-icon-container"><FaInfoCircle /></div>
                          <div className="activity-content-main">
                            <div className="activity-msg">
                              <strong>{activity.user?.name || "Member"}</strong> marked as <strong>{activity.meta?.status?.replace('_', ' ')}</strong>
                            </div>
                            <div className="activity-time-relative">{getRelativeTime(activity.createdAt)}</div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={activity._id} className="activity-item-simple">
                        <div className="activity-icon-container"><FaInfoCircle /></div>
                        <div className="activity-content-main">
                          <div className="activity-msg">
                            <strong>{activity.user?.name || "Member"}</strong> {activity.detail.toLowerCase()}
                          </div>
                          <div className="activity-time-relative">{getRelativeTime(activity.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetails;
