import { api } from "./api";

/**
 * listTodos
 * @param {object} filters - { status, user, priority, client, service, archived, created_from, created_to, due_from, due_to, q }
 * @param {number} page
 * @param {number} limit
 */
export const listTodos = (filters = {}, page = 1, limit = 100) => {
  return api.get("/todos", {
    params: {
      ...filters,
      page,
      limit
    }
  });
};

/**
 * createTodo
 * @param {object} data
 */
export const createTodo = (data) => {
  return api.post("/todos", data);
};

/**
 * getTodoById
 * @param {string} id
 */
export const getTodoById = (id) => {
  return api.get(`/todos/${id}`);
};

/**
 * updateTodo
 * @param {string} id
 * @param {object} data
 */
export const updateTodo = (id, data) => {
  return api.patch(`/todos/${id}`, data);
};

/**
 * deleteTodo
 * @param {string} id
 */
export const deleteTodo = (id) => {
  return api.delete(`/todos/${id}`);
};

/**
 * markTodoComplete
 * @param {string} id
 */
export const markTodoComplete = (id) => {
  return api.patch(`/todos/${id}/complete`);
};

/**
 * moveTodo (Kanban move)
 * @param {string} id
 * @param {string} status - newStatus
 * @param {number} position - newPosition
 */
export const moveTodo = (id, status, position) => {
  return api.patch(`/todos/${id}/move`, { status, position });
};
