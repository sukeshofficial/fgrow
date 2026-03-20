import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SideBar from "../../components/SideBar";
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
import { FaCheckCircle, FaRegCircle, FaTrash, FaPlay, FaStop, FaPlus, FaHistory, FaClock, FaArrowLeft } from "react-icons/fa";
import "../../styles/Tasks.css";

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTimelogId, setActiveTimelogId] = useState(null);

  const fetchTaskDetails = useCallback(async () => {
    try {
      const [taskResp, activitiesResp] = await Promise.all([
        getTask(id),
        getTaskActivities(id)
      ]);
      if (taskResp.data.success) {
        setTask(taskResp.data.data);
        // Check for active timer
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
      console.error("Failed to fetch task details", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  const handleStatusChange = async (newStatus) => {
    try {
      const resp = await updateTaskStatus(id, newStatus);
      if (resp.data.success) {
        fetchTaskDetails();
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    try {
      await addChecklistItem(id, { title: newChecklistItem });
      setNewChecklistItem("");
      fetchTaskDetails();
    } catch (err) {
      alert("Failed to add checklist item");
    }
  };

  const handleToggleChecklist = async (idx, isDone) => {
    try {
      await updateChecklistItem(id, idx, { is_done: !isDone });
      fetchTaskDetails();
    } catch (err) {
      alert("Failed to update checklist item");
    }
  };

  const handleDeleteChecklist = async (idx) => {
    try {
      await deleteChecklistItem(id, idx);
      fetchTaskDetails();
    } catch (err) {
      alert("Failed to delete checklist item: " + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleTimer = async () => {
    try {
      if (isTimerRunning) {
        await stopTimelog(id, activeTimelogId);
      } else {
        await startTimelog(id);
      }
      fetchTaskDetails();
    } catch (err) {
      alert("Failed to toggle timer");
    }
  };

  if (loading) return <div className="loading">Loading task details...</div>;
  if (!task) return <div className="error">Task not found</div>;

  return (
    <>
      <SideBar />
      <div className="clients">
        <div className="client-list-container">
          <button 
            onClick={() => navigate("/tasks")} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <FaArrowLeft /> Back to Tasks
          </button>

          <div className="task-details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h1 className="client-list-title">{task.title}</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{task.description || "No description provided."}</p>
            </div>
            <div className="task-actions" style={{ display: 'flex', gap: '12px' }}>
              <select 
                className="status-dropdown" 
                value={task.status} 
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: '600' }}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button 
                onClick={handleToggleTimer}
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: isTimerRunning ? 'var(--error-red)' : 'var(--primary-accent)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                }}
              >
                {isTimerRunning ? <FaStop /> : <FaPlay />}
                {isTimerRunning ? "Stop Timer" : "Start Timer"}
              </button>
            </div>
          </div>

          <div className="task-details-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            <div className="main-content">
              {/* Checklist Section */}
              <div className="task-card" style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaCheckCircle color="var(--primary-accent)" /> Checklist
                </h3>
                <div className="checklist-items">
                  {task.checklist?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span onClick={() => handleToggleChecklist(idx, item.is_done)} style={{ cursor: 'pointer', display: 'flex' }}>
                        {item.is_done ? <FaCheckCircle color="var(--primary-accent)" /> : <FaRegCircle color="var(--text-muted)" />}
                      </span>
                      <span style={{ flex: 1, textDecoration: item.is_done ? 'line-through' : 'none', color: item.is_done ? 'var(--text-muted)' : 'inherit' }}>
                        {item.title}
                      </span>
                      <button onClick={() => handleDeleteChecklist(idx)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddChecklist} style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Add a checklist item..." 
                    className="form-input" 
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" style={{ background: 'var(--primary-accent)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '8px', cursor: 'pointer' }}>
                    <FaPlus />
                  </button>
                </form>
              </div>

              {/* Time Logs Section */}
              <div className="task-card" style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaClock color="var(--primary-accent)" /> Time Logs
                </h3>
                <div className="timelogs-list">
                  {task.timelogs?.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No time logged yet.</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '8px 0' }}>User</th>
                          <th>Start</th>
                          <th>End</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {task.timelogs.map((log, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '12px 0' }}>{log.user?.name || "Staff"}</td>
                            <td>{new Date(log.start_time).toLocaleString()}</td>
                            <td>{log.end_time ? new Date(log.end_time).toLocaleString() : <span style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>Active...</span>}</td>
                            <td>{log.end_time ? `${log.duration_minutes || 0}m` : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="sidebar-content">
              {/* Activity Feed */}
              <div className="task-card" style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaHistory color="var(--primary-accent)" /> Activity
                </h3>
                <div className="activity-feed" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
                  {activities.map((activity) => (
                    <div key={activity._id} style={{ fontSize: '13px' }}>
                      <div style={{ fontWeight: '600' }}>{activity.activity_type.replace('_', ' ')}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{activity.detail}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date(activity.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
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
