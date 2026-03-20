import Task from "../models/task/task.model.js";
import TaskActivity from "../models/task/taskActivity.model.js";
import mongoose from "mongoose";

const DEFAULT_LIMIT = 20;

/* ------------------ list tasks ------------------ */
export const listTasks = async (filters = {}) => {
  const {
    tenant_id,
    search,
    status,
    priority,
    service,
    client,
    dateFrom,
    dateTo,
    page = 1,
    limit = DEFAULT_LIMIT,
    sortBy = "createdAt",
    sortDir = -1,
  } = filters;

  if (!tenant_id) throw new Error("tenant_id required");

  const taskQuery = {
    tenant_id: new mongoose.Types.ObjectId(tenant_id),
    archived: false,
  };

  if (status) taskQuery.status = status;
  if (priority) taskQuery.priority = priority;
  if (service) taskQuery.service = new mongoose.Types.ObjectId(service);
  if (client) taskQuery.client = new mongoose.Types.ObjectId(client);

  if (dateFrom || dateTo) taskQuery.creation_date = {};
  if (dateFrom) taskQuery.creation_date.$gte = new Date(dateFrom);
  if (dateTo) taskQuery.creation_date.$lte = new Date(dateTo);

  if (search) {
    taskQuery.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [tasks, totalTasks] = await Promise.all([
    Task.find(taskQuery)
      .populate("client", "name")
      .populate("service", "name")
      .populate("users", "name email")
      .populate("tags", "name")
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Task.countDocuments(taskQuery),
  ]);

  return {
    items: tasks,
    total: totalTasks,
    page: Number(page),
    limit: Number(limit),
  };
};

/* ------------------ create task ------------------ */
export const createTask = async (payload, user) => {
  if (!payload.tenant_id) throw new Error("tenant_id required");
  if (!payload.client) throw new Error("client required");
  if (!payload.service) throw new Error("service required");
  if (!payload.title) throw new Error("title required");

  if (payload.users && Array.isArray(payload.users)) {
    payload.users = payload.users.map((u) =>
      typeof u === "object" ? u.user : u,
    );
  }

  if (payload.tags && Array.isArray(payload.tags)) {
    payload.tags = payload.tags.map((t) => (typeof t === "object" ? t.tag : t));
  }

  const task = new Task({
    ...payload,
    created_by: user.id,
    updated_by: user.id,
  });

  const createdTask = await task.save();

  await TaskActivity.create({
    tenant_id: createdTask.tenant_id,
    task: createdTask._id,
    user: user.id,
    activity_type: "created",
    detail: "New Task Created",
  });

  return createdTask.toObject();
};

/* ------------------ get task ------------------ */
export const getTaskById = async (taskId, tenant_id) => {
  const taskQuery = { _id: taskId };

  if (tenant_id) taskQuery.tenant_id = tenant_id;

  return Task.findOne(taskQuery)
    .populate("client")
    .populate("service")
    .populate("users", "name email")
    .populate("tags", "name")
    .lean();
};

/* ------------------ update task ------------------ */
export const updateTask = async (taskId, patch, user = {}) => {
  const updatePayload = { ...patch, updated_by: user.id };

  if (patch.status === "completed") {
    updatePayload.completed_at = new Date();
  } else if (patch.status && patch.status !== "completed") {
    updatePayload.completed_at = null;
  }

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $set: updatePayload },
    { new: true },
  ).lean();

  if (!updatedTask) throw new Error("Task not found");

  await TaskActivity.create({
    tenant_id: updatedTask.tenant_id,
    task: updatedTask._id,
    user: user.id,
    activity_type: "updated",
    detail: "Task updated",
    meta: { patch },
  });

  return updatedTask;
};

/* ------------------ update status ------------------ */
export const updateStatus = async (taskId, status, user = {}) => {
  if (
    !["pending", "in_progress", "completed", "verified", "cancelled"].includes(
      status,
    )
  ) {
    throw new Error("invalid status");
  }

  const updatePayload = { status, updated_by: user.id };

  if (status === "completed") updatePayload.completed_at = new Date();
  if (status !== "completed") updatePayload.completed_at = null;

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $set: updatePayload },
    { new: true },
  ).lean();

  if (!updatedTask) throw new Error("Task not found");

  await TaskActivity.create({
    tenant_id: updatedTask.tenant_id,
    task: updatedTask._id,
    user: user.id,
    activity_type: "status_changed",
    detail: `Status updated to ${status}`,
    meta: { status },
  });

  return updatedTask;
};

/* ------------------ checklist ------------------ */
export const addChecklistItem = async (taskId, checklistItem, user = {}) => {
  if (!checklistItem || !checklistItem.title)
    throw new Error("checklist title required");

  const task = await Task.findOne({ _id: taskId, tenant_id: user.tenant_id });
  if (!task) throw new Error("Task not found or unauthorized");

  task.checklist.push({ ...checklistItem, is_done: false });
  task.markModified("checklist");
  await task.save();

  const addedChecklistItem = task.checklist[task.checklist.length - 1];

  await TaskActivity.create({
    tenant_id: task.tenant_id,
    task: task._id,
    user: user.id,
    activity_type: "checklist_added",
    detail: `Checklist item added: ${checklistItem.title}`,
    meta: { item: addedChecklistItem },
  });

  return addedChecklistItem;
};

export const updateChecklistItem = async (
  taskId,
  checklistIndex,
  updateData,
  user = {},
) => {
  const task = await Task.findOne({ _id: taskId, tenant_id: user.tenant_id });

  if (!task) throw new Error("Task not found or unauthorized");

  if (
    checklistIndex === undefined ||
    checklistIndex < 0 ||
    checklistIndex >= task.checklist.length
  ) {
    throw new Error("Checklist item not found");
  }

  const item = task.checklist[checklistIndex];

  /* update fields */
  if (updateData.title !== undefined) item.title = updateData.title;
  if (updateData.notes !== undefined) item.notes = updateData.notes;
  if (updateData.order !== undefined) item.order = updateData.order;

  /* handle completion */
  if (updateData.is_done !== undefined) {
    item.is_done = updateData.is_done;

    if (updateData.is_done) {
      item.completed_by = user.id;
      item.completed_at = new Date();
    } else {
      item.completed_by = null;
      item.completed_at = null;
    }
  }

  task.markModified("checklist");
  await task.save();

  await TaskActivity.create({
    tenant_id: task.tenant_id,
    task: task._id,
    user: user.id,
    activity_type: "checklist_updated",
    detail: `Checklist item updated: ${item.title}`,
    meta: { item },
  });

  return item;
};

export const deleteChecklistItem = async (
  taskId,
  checklistIndex,
  user = {},
) => {
  const task = await Task.findOne({ _id: taskId, tenant_id: user.tenant_id });

  if (!task) throw new Error("Task not found or unauthorized");

  if (
    checklistIndex === undefined ||
    checklistIndex < 0 ||
    checklistIndex >= task.checklist.length
  ) {
    throw new Error("Checklist item not found");
  }

  const removedItem = task.checklist[checklistIndex];

  task.checklist.splice(checklistIndex, 1);

  task.markModified("checklist");
  await task.save();

  await TaskActivity.create({
    tenant_id: task.tenant_id,
    task: task._id,
    user: user.id,
    activity_type: "checklist_deleted",
    detail: `Checklist item deleted: ${removedItem.title}`,
    meta: { item: removedItem },
  });

  return removedItem;
};

/* ------------------ timelog start ------------------ */
export const startTimelog = async (taskId, user) => {
  const task = await Task.findOne({ _id: taskId, tenant_id: user.tenant_id });
  if (!task) throw new Error("Task not found or unauthorized");

  const timeLog = {
    user: user.id,
    start_time: new Date(),
    end_time: null,
    duration_minutes: 0,
    note: "",
  };

  task.timelogs.push(timeLog);
  task.markModified("timelogs");
  await task.save();

  const latestTimeLog = task.timelogs[task.timelogs.length - 1];

  await TaskActivity.create({
    tenant_id: task.tenant_id,
    task: task._id,
    user: user.id,
    activity_type: "timelog_started",
    detail: "Time log started",
    meta: { timelog: latestTimeLog },
  });

  return latestTimeLog;
};

/* ------------------ timelog stop ------------------ */
export const stopTimelog = async (taskId, timelogId = null, user) => {
  const task = await Task.findOne({ _id: taskId, tenant_id: user.tenant_id });
  if (!task) throw new Error("Task not found or unauthorized");

  let timeLogIndex = -1;

  if (timelogId) {
    timeLogIndex = task.timelogs.findIndex(
      (log) => String(log._id) === String(timelogId),
    );
  } else {
    for (let i = task.timelogs.length - 1; i >= 0; i--) {
      if (
        !task.timelogs[i].end_time &&
        String(task.timelogs[i].user) === String(user.id)
      ) {
        timeLogIndex = i;
        break;
      }
    }
  }

  if (timeLogIndex === -1) throw new Error("Open timelog not found");

  const timeLog = task.timelogs[timeLogIndex];

  timeLog.end_time = new Date();

  const durationMs =
    timeLog.end_time.getTime() - new Date(timeLog.start_time).getTime();

  timeLog.duration_minutes = Math.round(durationMs / 60000);

  task.markModified("timelogs");
  await task.save();

  await TaskActivity.create({
    tenant_id: task.tenant_id,
    task: task._id,
    user: user.id,
    activity_type: "timelog_stopped",
    detail: "Time log stopped",
    meta: { timelog: timeLog },
  });

  return timeLog;
};

export const addTimelog = async (taskId, timelogData = {}, user) => {
  const task = await Task.findOne({ _id: taskId, tenant_id: user.tenant_id });
  if (!task) throw new Error("Task not found or unauthorized");

  if (!timelogData.start_time) throw new Error("start_time required");

  const startTime = new Date(timelogData.start_time);
  const endTime = timelogData.end_time ? new Date(timelogData.end_time) : null;

  let durationMinutes = 0;

  if (endTime) {
    const durationMs = endTime.getTime() - startTime.getTime();
    durationMinutes = Math.round(durationMs / 60000);
  }

  const newTimelog = {
    user: user.id,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: durationMinutes,
    note: timelogData.note || "",
  };

  task.timelogs.push(newTimelog);
  task.markModified("timelogs");
  await task.save();

  const addedLog = task.timelogs[task.timelogs.length - 1];

  await TaskActivity.create({
    tenant_id: task.tenant_id,
    task: task._id,
    user: user.id,
    activity_type: "timelog_added",
    detail: "Manual time log added",
    meta: { timelog: addedLog },
  });

  return addedLog;
};

/* ------------------ activities ------------------ */
export const getActivities = async (taskId, tenant_id, opts = {}) => {
  const activityQuery = { task: taskId };

  if (tenant_id) activityQuery.tenant_id = tenant_id;

  const limit = opts.limit ? Number(opts.limit) : 50;

  return TaskActivity.find(activityQuery)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/* ------------------ delete task ------------------ */
export const deleteTask = async (taskId, tenantId) => {
  const deletedTask = await Task.findOneAndDelete({
    _id: taskId,
    tenant_id: tenantId,
  });

  if (!deletedTask) throw new Error("Task not found or unauthorized");

  // Optional: Clean up activities, but usually better to keep them or cascade delete if needed
  await TaskActivity.deleteMany({ task: taskId });

  return deletedTask;
};
