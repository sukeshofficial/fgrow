// controllers/todo.controller.js
import {
  createTodo,
  listTodos,
  getTodoById,
  updateTodo,
  archiveTodo,
  markComplete,
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
 * Centralized error -> HTTP JSON responder used inside controllers.
 *
 * Behavior:
 *  - If err has `status` numeric -> use it.
 *  - If err.message === 'Todo already exists' -> 400.
 *  - Otherwise -> 500.
 *
 * For non-production, includes `stack` and `raw` to help debugging.
 */
function sendError(res, err) {
  // avoid sending headers twice
  if (res.headersSent) {
    // If headers already sent, do nothing (Express will handle)
    return;
  }

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

  // Include helpful debug info in non-production only
  if (process.env.NODE_ENV !== "production") {
    response.error = {
      // copy any other useful fields if present
      ...(err && typeof err === "object" ? { ...err } : {}),
    };
    // Don't include the full object twice
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
      due_date: req.body.has_due_date ? req.body.due_date : null,
      recurrence: req.body.recurrence || {},
      assign_to_user: !!req.body.assign_to_user,
      user: req.body.assign_to_user ? req.body.user : null,
      priority: req.body.priority || "medium",
      client: req.body.client || null,
      service: req.body.service || null,
      created_by: req.user.id,
    };

    const todo = await createTodo(payload);
    return res.status(201).json({ success: true, data: todo });
  } catch (err) {
    // handle duplicate todo specially (service currently throws Error("Todo already exists"))
    if (err && err.message === "Todo already exists") {
      return sendError(res, { status: 400, message: err.message });
    }
    // If service threw {status, message} object, send that
    return sendError(res, err);
  }
}

/**
 * List / search todos
 * - By default completed todos are hidden.
 * - Use ?status=completed to only show completed.
 * - Use ?status=all to include all statuses (including completed).
 */
export async function listTodosController(req, res, next) {
  try {
    const tenant_id = ensureTenant(req);

    const filters = {
      tenant_id,
      status: req.query.status, // undefined -> service will hide completed by default
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
      Math.max(1, parseInt(req.query.limit || "25", 10)),
      200,
    );

    const result = await listTodos(filters, {
      page,
      limit,
      sort: { createdAt: -1 },
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
 * Update todo - only owner/staff or assigned user allowed (enforced here)
 */
export async function updateTodoController(req, res, next) {
  try {
    const tenant_id = ensureTenant(req);
    const id = req.params.id;
    const actor = req.user;
    const actorId = actor?.id;

    const todo = await getTodoById(tenant_id, id);
    if (!todo)
      return sendError(res, { status: 404, message: "Todo not found" });

    const isStaff = ["owner", "staff"].includes(actor.tenant_role);
    const isAssignedUser =
      todo.user && actorId && todo.user.toString() === actorId.toString();
    if (!isStaff && !isAssignedUser) {
      return sendError(res, { status: 403, message: "Forbidden" });
    }

    const allowed = [
      "title",
      "details",
      "has_due_date",
      "due_date",
      "recurrence",
      "assign_to_user",
      "user",
      "priority",
      "client",
      "service",
      "status",
      "archived",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await updateTodo(tenant_id, id, updates, actor);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return sendError(res, err);
  }
}

/**
 * Delete (archive) - only staff/owner allowed
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
 * Mark complete - owner/staff or assigned user allowed
 */
export async function markTodoCompleteController(req, res, next) {
  try {
    const tenant_id = ensureTenant(req);
    const id = req.params.id;
    const actor = req.user;
    const actorId = actor?.id;

    const todo = await getTodoById(tenant_id, id);
    if (!todo)
      return sendError(res, { status: 404, message: "Todo not found" });

    const isStaff = ["owner", "staff"].includes(actor.tenant_role);
    const isAssignedUser =
      todo.user && actorId && todo.user.toString() === actorId.toString();
    if (!isStaff && !isAssignedUser) {
      return sendError(res, { status: 403, message: "Forbidden" });
    }

    const { todo: completed, nextTodo } = await markComplete(
      tenant_id,
      id,
      actor,
    );
    return res.json({ success: true, data: { completed, next: nextTodo } });
  } catch (err) {
    return sendError(res, err);
  }
}
