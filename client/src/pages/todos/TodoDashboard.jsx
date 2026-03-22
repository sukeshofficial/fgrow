import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/SideBar";
import KanbanBoard from "./components/KanbanBoard";
import TodoModal from "./components/TodoModal";
import DeleteModal from "../../components/ui/DeleteModal";
import { listTodos, moveTodo, deleteTodo } from "../../api/todo.api";
import { FaSearch, FaPlus } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";
import "../../styles/Todo.css";
import { Spinner } from "../../components/ui/Spinner";

const TodoDashboard = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);

  // Shared data for dropdowns
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    console.log("TodoDashboard: fetchData triggered", search);
    try {
      setLoading(true);
      // Fetch todos, clients, services, and staff in parallel
      const [tResp, cResp, sResp, stResp] = await Promise.all([
        listTodos({ status: "all", q: search }),
        import("../../api/client.api").then(m => m.listClientsByTenantId()),
        import("../../api/service.api").then(m => m.listServicesByTenant()),
        import("../../api/client.api").then(m => m.listStaff())
      ]);

      if (tResp.data.success) setTodos(tResp.data.items || []);
      if (cResp.data.success) setClients(cResp.data.data || []);
      if (sResp.data.success) setServices(sResp.data.data || []);
      if (stResp.data.success) setStaff(stResp.data.data || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchTodos = fetchData; // For compatibility with existing calls

  const handleMove = async (todoId, newStatus, newPosition) => {
    try {
      await moveTodo(todoId, newStatus, newPosition);
      fetchTodos();
    } catch (err) {
      console.error("Move failed", err);
      fetchTodos();
    }
  };

  const handleEdit = (todo) => {
    setSelectedTodo(todo);
    setIsModalOpen(true);
  };

  const handleDeleteTrigger = (id) => {
    setTodoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!todoToDelete) return;
    setDeleting(true);
    try {
      await deleteTodo(todoToDelete);
      setIsDeleteModalOpen(false);
      setTodoToDelete(null);
      fetchTodos();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete to-do");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = () => {
    setSelectedTodo(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <Sidebar />
      <div className="clients">
        <div className="todo-dashboard-container">
          <header className="todo-header">
            <div className="todo-title-section">
              <h1>To-do</h1>
            </div>

            <div className="todo-actions">
              <div className="todo-search-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="todo-search-input"
                  placeholder="Search to-dos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button className="filter-btn">
                <FiFilter />
                Filters
              </button>

              <button className="new-todo-btn" onClick={handleCreate}>
                <FaPlus />
                New To-do
              </button>
            </div>
          </header>

          {loading && todos.length === 0 ? (
            <div className="loading-state" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
              <Spinner />
            </div>
          ) : (
            <KanbanBoard
              todos={todos}
              onMove={handleMove}
              onEdit={handleEdit}
              onDelete={handleDeleteTrigger}
              onSuccess={fetchTodos}
              clients={clients}
              services={services}
              staff={staff}
            />
          )}

          {isModalOpen && (
            <TodoModal
              todo={selectedTodo}
              onClose={() => setIsModalOpen(false)}
              onSuccess={() => {
                setIsModalOpen(false);
                fetchTodos();
              }}
              clients={clients}
              services={services}
              staff={staff}
            />
          )}

          {isDeleteModalOpen && (
            <DeleteModal
              title="Delete To-do?"
              message="Are you sure you want to delete this to-do? This cannot be undone."
              onConfirm={handleConfirmDelete}
              onCancel={() => {
                setIsDeleteModalOpen(false);
                setTodoToDelete(null);
              }}
              submitting={deleting}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default TodoDashboard;
