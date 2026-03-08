// controllers/task.controller.js

import {
  listTasks,
  createTask,
  getTaskById,
  updateTask,
  updateStatus,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  startTimelog,
  stopTimelog,
  addTimelog,
  getActivities,
} from "../services/task.service.js";

const sendSuccess = (res, data) => res.json({ success: true, data });

const sendError = (res, error, statusCode = 400) =>
  res.status(statusCode).json({
    success: false,
    message: error?.message || String(error),
  });

/* ------------------ list tasks ------------------ */
export async function listTasksController(req, res) {
  try {
    const tenantId = req.user.tenant_id;

    const filters = {
      ...req.query,
      tenant_id: tenantId,
    };

    const taskList = await listTasks(filters);

    return sendSuccess(res, taskList);
  } catch (error) {
    return sendError(res, error);
  }
}

/* ------------------ create task ------------------ */
export async function createTaskController(req, res) {
  try {
    const tenantId = req.user.tenant_id;
    const currentUser = req.user;

    const taskPayload = {
      ...req.body,
      tenant_id: tenantId,
    };

    const createdTask = await createTask(taskPayload, currentUser);

    return sendSuccess(res, createdTask);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

/* ------------------ get task ------------------ */
export async function getTaskController(req, res) {
  try {
    const tenantId = req.user.tenant_id;

    const task = await getTaskById(req.params.id, tenantId);

    if (!task) {
      return sendError(res, new Error("Task not found"), 404);
    }

    return sendSuccess(res, task);
  } catch (error) {
    return sendError(res, error);
  }
}

/* ------------------ update task ------------------ */
export async function updateTaskController(req, res) {
  try {
    const currentUser = req.user;

    const updatedTask = await updateTask(req.params.id, req.body, currentUser);

    return sendSuccess(res, updatedTask);
  } catch (error) {
    return sendError(res, error);
  }
}

/* ------------------ update status ------------------ */
export async function updateStatusController(req, res) {
  try {
    const currentUser = req.user;

    const { status } = req.body;

    const updatedTask = await updateStatus(req.params.id, status, currentUser);

    return sendSuccess(res, updatedTask);
  } catch (error) {
    return sendError(res, error);
  }
}

/* ------------------ checklist ------------------ */
export async function addChecklistItemController(req, res) {
  try {
    const currentUser = req.user;

    const checklistItem = await addChecklistItem(
      req.params.id,
      req.body,
      currentUser,
    );

    return sendSuccess(res, checklistItem);
  } catch (error) {
    return sendError(res, error);
  }
}

export async function updateChecklistItemController(req, res) {
  try {
    const currentUser = req.user;

    const checklistIndex = Number(req.params.idx);

    const updatedChecklistItem = await updateChecklistItem(
      req.params.id,
      checklistIndex,
      req.body,
      currentUser,
    );

    return sendSuccess(res, updatedChecklistItem);
  } catch (error) {
    return sendError(res, error);
  }
}

export async function deleteChecklistItemController(req, res) {
  try {
    const currentUser = req.user;

    const checklistIndex = Number(req.params.idx);

    const deletedChecklistItem = await deleteChecklistItem(
      req.params.id,
      checklistIndex,
      currentUser,
    );

    return sendSuccess(res, deletedChecklistItem);
  } catch (error) {
    return sendError(res, error);
  }
}

/* ------------------ timelog ------------------ */
export async function startTimelogController(req, res) {
  try {
    const currentUser = req.user || { id: req.body.userId };

    const startedTimeLog = await startTimelog(req.params.id, currentUser.id);

    return sendSuccess(res, startedTimeLog);
  } catch (error) {
    return sendError(res, error);
  }
}

export async function stopTimelogController(req, res) {
  try {
    const currentUser = req.user;

    const stoppedTimeLog = await stopTimelog(
      req.params.id,
      req.body.timelogId,
      currentUser.id,
    );

    return sendSuccess(res, stoppedTimeLog);
  } catch (error) {
    return sendError(res, error);
  }
}

export async function addTimelogController(req, res) {
  try {
    const currentUser = req.user || { id: req.body.userId };

    const createdTimeLog = await addTimelog(
      req.params.id,
      req.body,
      currentUser.id,
    );

    return sendSuccess(res, createdTimeLog);
  } catch (error) {
    return sendError(res, error);
  }
}

/* ------------------ activity ------------------ */
export async function getActivitiesController(req, res) {
  try {
    const tenantId = req.tenant?.id;

    const activities = await getActivities(req.params.id, tenantId, req.query);

    return sendSuccess(res, activities);
  } catch (error) {
    return sendError(res, error);
  }
}
