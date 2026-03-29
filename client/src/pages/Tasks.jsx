import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../components/SideBar";
import TaskTable from "./tasks/components/TaskTable";
import TaskFilterBar from "./tasks/components/TaskFilterBar";
import TaskAdvancedFilterModal from "./tasks/components/TaskAdvancedFilterModal";
import DeleteModal from "../components/ui/DeleteModal";
import { listTasks, deleteTask } from "../api/task.api";
import { useDelayedLoading } from "../hooks/useDelayedLoading";
import logger from "../utils/logger.js";
import "../styles/ClientList.css";
import "../styles/Tasks.css";

/**
 * Tasks page
 *
 * Main authenticated landing page for task management.
 */
const Tasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useDelayedLoading(loading, 300);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "",
    service: "",
    client: "",
    dateFrom: "",
    dateTo: "",
  });

  // Debounce helper
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const fetchTasks = async (currentFilters, currentPage) => {
    setLoading(true);
    try {
      const statusFilter = currentFilters.status === "all" ? {} : { status: currentFilters.status };
      const params = {
        page: currentPage,
        limit: pagination.limit,
        search: currentFilters.search,
        priority: currentFilters.priority,
        service: currentFilters.service,
        client: currentFilters.client,
        dateFrom: currentFilters.dateFrom,
        dateTo: currentFilters.dateTo,
        ...statusFilter,
      };

      const resp = await listTasks(params);
      if (resp.data.success) {
        setTasks(resp.data.data.items);
        setPagination((prev) => ({
          ...prev,
          total: resp.data.data.total,
          total_pages: Math.ceil(resp.data.data.total / prev.limit),
        }));
      }
    } catch (e) {
      logger.error("TasksPage", "Failed to fetch tasks", e);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((f, p) => fetchTasks(f, p), 500),
    []
  );

  useEffect(() => {
    debouncedFetch(filters, pagination.page);
  }, [filters, pagination.page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleAction = (type, task) => {
    if (type === "view") navigate(`/tasks/${task._id}`);
    if (type === "edit") navigate(`/tasks/edit/${task._id}`);
  };

  const handleDeleteTask = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      const resp = await deleteTask(taskToDelete._id);
      if (resp.data.success) {
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
        fetchTasks(filters, pagination.page);
      }
    } catch (e) {
      logger.error("TasksPage", "Failed to delete task", e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <SideBar />
      <div className="clients">
        <div className="client-list-container">
          <div className="client-list-header">
            <h1 className="client-list-title">Tasks</h1>
          </div>

          <TaskFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onCreateNew={() => navigate("/tasks/create")}
            onOpenAdvanced={() => setIsFilterModalOpen(true)}
          />

          <TaskAdvancedFilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            filters={filters}
            onApply={(newFilters) => {
              setFilters(newFilters);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            onClear={() =>
              setFilters({
                search: "",
                status: "all",
                priority: "",
                service: "",
                client: "",
                dateFrom: "",
                dateTo: "",
              })
            }
          />

          <TaskTable
            tasks={tasks}
            loading={showLoading}
            onAction={handleAction}
            onDelete={handleDeleteTask}
          />

          {!showLoading && tasks.length > 0 && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </span>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  &lt;
                </button>
                {[...Array(pagination.total_pages || 0)].map((_, i) => (
                  <button
                    key={i}
                    className={`page-btn ${pagination.page === i + 1 ? "active" : ""}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={pagination.page === pagination.total_pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isDeleteModalOpen && (
        <DeleteModal
          title="Delete Task"
          message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setTaskToDelete(null);
          }}
          submitting={isDeleting}
        />
      )}
    </>
  );
};

export default Tasks;
