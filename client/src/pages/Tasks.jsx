import React, { useState, useCallback, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";


import SideBar from "../components/SideBar";
import TaskTable from "./tasks/components/TaskTable";
import TaskFilterBar from "./tasks/components/TaskFilterBar";
import { listTasks, deleteTask } from "../api/task.api";
import { useDelayedLoading } from "../hooks/useDelayedLoading";
import { useAuth } from "../hooks/useAuth";
import logger from "../utils/logger.js";
import "../styles/ClientList.css";
import "../styles/Tasks.css";

// Lazy load modals
const TaskAdvancedFilterModal = React.lazy(() => import("./tasks/components/TaskAdvancedFilterModal"));
const DeleteModal = React.lazy(() => import("../components/ui/DeleteModal"));

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Tasks = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "",
    service: "",
    client: "",
    user: "",
    dateFrom: "",
    dateTo: "",
  });

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  const handleDebounceSearch = useCallback(
    debounce((value) => setDebouncedSearch(value), 500),
    []
  );

  /**
   * Fetch tasks using TanStack Query
   */
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", { ...filters, search: debouncedSearch }, pagination.page],
    queryFn: async () => {
      const statusFilter = filters.status === "all" ? {} : { status: filters.status };
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        priority: filters.priority,
        service: filters.service,
        client: filters.client,
        user: filters.user,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        ...statusFilter,
      };
      const resp = await listTasks(params);
      return resp.data.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const tasks = data?.items || [];
  const total = data?.total || 0;
  const total_pages = Math.ceil(total / pagination.limit);

  const showLoading = useDelayedLoading(isLoading, 300);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));

    if (key === 'search') {
      handleDebounceSearch(value);
    }
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
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
            currentUser={currentUser}
          />

          <Suspense fallback={null}>
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
                  user: "",
                  dateFrom: "",
                  dateTo: "",
                })
              }
            />
          </Suspense>


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
                {Math.min(pagination.page * pagination.limit, total)} of {total} entries
              </span>

              <div className="pagination-controls">
                <button
                  className="page-btn"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  &lt;
                </button>
                {[...Array(total_pages || 0)].map((_, i) => (
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
                  disabled={pagination.page === total_pages}
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
        <Suspense fallback={null}>
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
        </Suspense>
      )}

    </>
  );
};

export default Tasks;
