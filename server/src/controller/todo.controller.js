// controllers/todo.controller.js
import {
  createTodo,
  listTodos,
  getTodoById,
  updateTodo,
  archiveTodo,
  markComplete,
  updateTodoPosition,
} from "../services/todo.service.js";

/**
 * Helpers
 */
function ensureTenant(req) {
  const tenant_id = req.user?.tenant_id;
  if (!tenant_id) {
    const err = new Error("Missing tenant");
    err.status = 401;
    throw err;
  }
  return tenant_id;
}

/**
 * sendError
 */
function sendError(res, err) {
  if (res.headersSent) return;

  const isKnownStatus = Number.isInteger(err?.status);
  const status = isKnownStatus
    ? err.status
    : err?.message === "Todo already exists"
      ? 400
      : 500;

  const response = {
    success: false,
    message: err?.message || "Internal server error",
  };

  if (process.env.NODE_ENV !== "production") {
    response.error = {
      ...(err && typeof err === "object" ? { ...err } : {}),
    };
    if (err && err.stack) response.error.stack = err.stack;
  }

  return res.status(status).json(response);
}

/**
 * Create a todo
 */
export async function createTodoController(req, res, next) {
  try {
    const tenant_id = ensureTenant(req);

    const payload = {
      tenant_id,
      title: req.body.title,
      details: req.body.details,
      has_due_date: !!req.body.has_due_date,
      due_date: (req.body.has_due_date && req.body.due_date) ? req.body.due_date : null,
      recurrence: req.body.recurrence || { enabled: false },
      assign_to_user: !!req.body.assign_to_user,
      user: (req.body.assign_to_user && req.body.user) ? req.body.user : null,
      priority: req.body.priority || "medium",
      client: req.body.client || null,
      service: req.body.service || null,
      created_by: req.user.id || req.user._id,
      status: req.body.status || "new"
    };

    const todo = await createTodo(payload);
    return res.status(201).json({ success: true, data: todo });
  } catch (err) {
    return sendError(res, err);
  }
}

/**
 * List / search todos
 */
export async function listTodosController(req, res, next) {
  try {
    const tenant_id = ensureTenant(req);

    const filters = {
      tenant_id,
      status: req.query.status,
      user: req.query.user,
      priority: req.query.priority,
      client: req.query.client,
      service: req.query.service,
      archived: req.query.archived === "true",
      created_from: req.query.created_from,
      created_to: req.query.created_to,
      due_from: req.query.due_from,
      due_to: req.query.due_to,
      search: req.query.q,
    };

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(req.query.limit || "100", 10)),
      500,
    );

    const result = await listTodos(filters, {
      page,
      limit,
      sort: { position: 1, createdAt: -1 },
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    return sendError(res, err);
  }
}

/**
 * Get single todo
 */
export async function getTodoByIdController(req, res, next) {
  try {
    const tenant_id = ensureTenant(req);
    const id = req.params.id;
    const todo = await getTodoById(tenant_id, id);
    if (!todo) {
      return sendError(res, { status: 404, message: "Todo not found" });
    }
    return res.json({ success: true, data: todo });
  } catch (err) {
    return sendError(res, err);
  }
}

/**
 * Update todo
 */
export async function updateTodoController(req, res, next) {
  try {
    const tenant_id = ensureTenant(req);
    const id = req.params.id;
    const actor = req.user;
    const actorId = String(actor.id || actor._id);

    const todo = await getTodoById(tenant_id, id);
    if (!todo) return sendError(res, { status: 404, message: "Todo not found" });

    const isStaff = ["owner", "staff"].includes(actor.tenant_role);
    const assignedUserId = todo.user?._id ? String(todo.user._id) : (todo.user ? String(todo.user) : null);
    const isAssignedUser = assignedUserId === actorId;

    if (!isStaff && !isAssignedUser) {
      return sendError(res, { status: 403, message: "Forbidden" });
    }

    const updates = {};
    const allowed = [
      "title", "details", "has_due_date", "due_date", "recurrence",
      "assign_to_user", "user", "priority", "client", "service",
      "status", "archived", "position"
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "due_date" && !req.body.due_date) {
            updates[key] = null;
        } else if ((key === "user" || key === "client" || key === "service") && !req.body[key]) {
            updates[key] = null;
        } else {
            updates[key] = req.body[key];
        }
      }
    }

    const updated = await updateTodo(tenant_id, id, updates, actor);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return sendError(res, err);
  }
}

/**
 * Delete (archive)
 */
export async function deleteTodoController(req, res, next) {
  try {
    const tenant_id = ensureTenant(req);
    const id = req.params.id;
    const actor = req.user;

    if (!["owner", "staff"].includes(actor.tenant_role)) {
      return sendError(res, { status: 403, message: "Forbidden" });
    }

    const archived = await archiveTodo(tenant_id, id, actor);
    return res.json({ success: true, data: archived });
  } catch (err) {
    return sendError(res, err);
  }
}

/**
 * Mark complete
 */
export async function markTodoCompleteController(req, res, next) {
  try {
    const tenant_id = ensureTenant(req);
    const id = req.params.id;
    const actor = req.user;
    const actorId = String(actor.id || actor._id);

    const todo = await getTodoById(tenant_id, id);
    if (!todo) return sendError(res, { status: 404, message: "Todo not found" });

    const isStaff = ["owner", "staff"].includes(actor.tenant_role);
    const assignedUserId = todo.user?._id ? String(todo.user._id) : (todo.user ? String(todo.user) : null);
    const isAssignedUser = assignedUserId === actorId;

    if (!isStaff && !isAssignedUser) {
      return sendError(res, { status: 403, message: "Forbidden" });
    }

    const { todo: completed, nextTodo } = await markComplete(tenant_id, id, actor);
    return res.json({ success: true, data: { completed, next: nextTodo } });
  } catch (err) {
    return sendError(res, err);
  }
}

/**
 * Move todo (Kanban drag and drop)
 */
export async function moveTodoController(req, res, next) {
  try {
    const tenant_id = ensureTenant(req);
    const id = req.params.id;
    const actor = req.user;
    const actorId = String(actor.id || actor._id);
    const { status: newStatus, position: newPosition } = req.body;

    if (newStatus === undefined || newPosition === undefined) {
      return sendError(res, { status: 400, message: "status and position required" });
    }

    const todo = await getTodoById(tenant_id, id);
    if (!todo) return sendError(res, { status: 404, message: "Todo not found" });

    const isStaff = ["owner", "staff"].includes(actor.tenant_role);
    const assignedUserId = todo.user?._id ? String(todo.user._id) : (todo.user ? String(todo.user) : null);
    const isAssignedUser = assignedUserId === actorId;

    if (!isStaff && !isAssignedUser) {
      return sendError(res, { status: 403, message: "Forbidden" });
    }

    const updated = await updateTodoPosition(tenant_id, id, newStatus, newPosition, actor);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return sendError(res, err);
  }
}
