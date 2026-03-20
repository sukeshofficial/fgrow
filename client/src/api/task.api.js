import { api } from "./api";

/**
 * List tasks with filters and pagination
 */
export const listTasks = (params) => api.get("/tasks", { params });

/**
 * Create a new task
 */
export const createTask = (data) => api.post("/tasks", data);

/**
 * Get a single task by ID
 */
export const getTask = (id) => api.get(`/tasks/${id}`);

/**
 * Update task basic info
 */
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);

/**
 * Delete a task
 */
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

/**
 * Update task status
 */
export const updateTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });

/**
 * Add checklist item
 */
export const addChecklistItem = (id, data) => api.post(`/tasks/${id}/checklist`, data);

/**
 * Update checklist item
 */
export const updateChecklistItem = (id, idx, data) => api.patch(`/tasks/${id}/checklist/${idx}`, data);

/**
 * Delete checklist item
 */
export const deleteChecklistItem = (id, idx) => api.delete(`/tasks/${id}/checklist/${idx}`);

/**
 * Start timelog
 */
export const startTimelog = (id) => api.post(`/tasks/${id}/timelogs/start`);

/**
 * Stop timelog
 */
export const stopTimelog = (id, timelogId) => api.post(`/tasks/${id}/timelogs/stop`, { timelogId });

/**
 * Add manual timelog
 */
export const addTimelog = (id, data) => api.post(`/tasks/${id}/timelogs`, data);

/**
 * Get task activities
 */
export const getTaskActivities = (id, params) => api.get(`/tasks/${id}/activities`, { params });
