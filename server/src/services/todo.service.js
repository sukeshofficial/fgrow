// services/todo.service.js
import mongoose from "mongoose";
import Todo from "../models/todo/todo.model.js"; // model file. :contentReference[oaicite:4]{index=4}

/**
 * computeNextDueDate
 * Simple recurrence advance: add `interval` * `unit` to the current date
 * unit ∈ ["day","week","month","year"]
 */
function computeNextDueDate(currentDate, recurrence) {
  if (!recurrence || !recurrence.enabled) return null;
  const { interval = 1, unit = "month" } = recurrence;
  const next = new Date(currentDate);

  switch (unit) {
    case "day":
      next.setDate(next.getDate() + interval);
      break;
    case "week":
      next.setDate(next.getDate() + interval * 7);
      break;
    case "month":
      // preserve month/day if possible
      next.setMonth(next.getMonth() + interval);
      break;
    case "year":
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      next.setMonth(next.getMonth() + interval);
  }

  return next;
}

/* -------------------------
   CRUD + recurrence helpers
   ------------------------- */

/**
 * createTodo(payload)
 * payload must include: tenant_id, title (required). Other fields optional.
 */
export async function createTodo(payload) {
  const { tenant_id, title, details, user, client, service, due_date } =
    payload;

  // Check for duplicate ACTIVE todo
  const query = {
    tenant_id,
    title,
    details: details || null,
    user: user || null,
    client: client || null,
    service: service || null,
    due_date: due_date || null,
    archived: false,
    status: { $ne: "completed" },
  };

  const existingTodo = await Todo.findOne(query);

  if (existingTodo) {
    throw new Error("Todo already exists");
  }

  // Get current max position for the status
  const lastTodo = await Todo.findOne({ tenant_id, status: payload.status || "new", archived: false })
    .sort({ position: -1 })
    .select("position")
    .lean();
  
  const nextPosition = lastTodo ? (lastTodo.position + 1) : 0;
  
  const todo = new Todo({ ...payload, position: nextPosition });
  await todo.save();

  return todo;
}

/**
 * listTodos(filters = {}, options = {})
 * filters: tenant_id (required), status, user, priority, client, service,
 * created_from, created_to, due_from, due_to, archived, search (text)
 *
 * options: page, limit, sort
 */
export async function listTodos(filters = {}, options = {}) {
  const {
    tenant_id,
    status,
    user,
    priority,
    client,
    service,
    created_from,
    created_to,
    due_from,
    due_to,
    archived = false,
    search,
  } = filters;

  const { page = 1, limit = 100, sort = { position: 1, createdAt: -1 } } = options;

  if (!tenant_id) throw new Error("tenant_id required");

  const query = { tenant_id, archived };

  // Status handling:
  // - If status === 'all' -> don't filter by status at all.
  // - If status provided and not 'all' -> filter by that status.
  // - If status not provided -> exclude completed todos by default.
  if (status) {
    if (status !== "all") {
      query.status = status;
    }
  } else {
    // default behavior: hide completed todos
    query.status = { $ne: "completed" };
  }

  if (user) query.user = user;
  if (priority) query.priority = priority;
  if (client) query.client = client;
  if (service) query.service = service;

  if (created_from || created_to) {
    query.createdAt = {};
    if (created_from) query.createdAt.$gte = new Date(created_from);
    if (created_to) query.createdAt.$lte = new Date(created_to);
  }
  if (due_from || due_to) {
    query.due_date = {};
    if (due_from) query.due_date.$gte = new Date(due_from);
    if (due_to) query.due_date.$lte = new Date(due_to);
  }

  if (search) {
    query.$or = [
      { title: new RegExp(search, "i") },
      { details: new RegExp(search, "i") },
    ];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Todo.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("user", "name email profile_avatar")
      .populate("created_by", "name profile_avatar")
      .populate("client", "name")
      .populate("service", "name")
      .lean(),
    Todo.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * getTodoById(tenant_id, id)
 */
export async function getTodoById(tenant_id, id) {
  if (!tenant_id) throw new Error("tenant_id required");
  const todo = await Todo.findOne({ _id: id, tenant_id }).populate(
    "user created_by client service",
  );
  return todo || null;
}

/**
 * updateTodo(tenant_id, id, updates, actor)
 * Only basic field updates here; permission checks belong to controller or caller.
 */
export async function updateTodo(tenant_id, id, updates = {}, actor = null) {
  const todo = await Todo.findOne({ _id: id, tenant_id });
  if (!todo) throw { status: 404, message: "Todo not found" };

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
    "archived_at",
    "position"
  ];

  Object.keys(updates).forEach((k) => {
    if (allowed.includes(k)) todo[k] = updates[k];
  });

  if (actor && actor.id) todo.updated_by = actor.id;
  await todo.save();
  return todo;
}

/**
 * updateTodoPosition(tenant_id, id, newStatus, newPosition, actor)
 */
export async function updateTodoPosition(tenant_id, id, newStatus, newPosition, actor = null) {
  const todo = await Todo.findOne({ _id: id, tenant_id });
  if (!todo) throw { status: 404, message: "Todo not found" };

  const oldStatus = todo.status;
  const oldPosition = todo.position;

  if (oldStatus === newStatus) {
    if (oldPosition < newPosition) {
      await Todo.updateMany(
        { tenant_id, status: newStatus, position: { $gt: oldPosition, $lte: newPosition }, archived: false },
        { $inc: { position: -1 } }
      );
    } else if (oldPosition > newPosition) {
      await Todo.updateMany(
        { tenant_id, status: newStatus, position: { $gte: newPosition, $lt: oldPosition }, archived: false },
        { $inc: { position: 1 } }
      );
    }
  } else {
    await Todo.updateMany(
      { tenant_id, status: oldStatus, position: { $gt: oldPosition }, archived: false },
      { $inc: { position: -1 } }
    );
    await Todo.updateMany(
      { tenant_id, status: newStatus, position: { $gte: newPosition }, archived: false },
      { $inc: { position: 1 } }
    );
    todo.status = newStatus;
  }

  todo.position = newPosition;
  if (actor && actor.id) todo.updated_by = actor.id;
  
  await todo.save();
  return todo;
}

/**
 * archiveTodo(tenant_id, id, actor)
 * Soft delete
 */
export async function archiveTodo(tenant_id, id, actor = null) {
  const todo = await Todo.findOne({ _id: id, tenant_id });
  if (!todo) throw { status: 404, message: "Todo not found" };

  await Todo.updateMany(
    { tenant_id, status: todo.status, position: { $gt: todo.position }, archived: false },
    { $inc: { position: -1 } }
  );

  todo.archived = true;
  todo.archived_at = new Date();
  if (actor && actor.id) todo.updated_by = actor.id;
  await todo.save();
  return todo;
}

/**
 * markComplete(tenant_id, id, actor)
 * Marks the todo completed. If recurrence.enabled, attempt to create next occurrence
 * following recurrence schema rules (ends_on, occurrences).
 *
 * Returns { todo: completedTodo, nextTodo: createdTodo|null }
 */
export async function markComplete(tenant_id, id, actor = null) {
  const todo = await Todo.findOne({ _id: id, tenant_id });
  if (!todo) throw { status: 404, message: "Todo not found" };

  if (todo.status === "completed") return { todo, nextTodo: null };

  const oldStatus = todo.status;
  const oldPosition = todo.position;

  todo.status = "completed";
  todo.completed_at = new Date();
  const lastComp = await Todo.findOne({ tenant_id, status: "completed", archived: false })
    .sort({ position: -1 })
    .select("position")
    .lean();
  todo.position = lastComp ? (lastComp.position + 1) : 0;
  
  if (actor && actor._id) todo.updated_by = actor._id;
  await todo.save();

  await Todo.updateMany(
    { tenant_id, status: oldStatus, position: { $gt: oldPosition }, archived: false },
    { $inc: { position: -1 } }
  );

  let nextTodo = null;
  const r = todo.recurrence || {};

  if (r.enabled && todo.has_due_date && todo.due_date) {
    const occurrencesLeft =
      typeof r.occurrences === "number" && r.occurrences > 0
        ? r.occurrences
        : null;

    // If occurrences provided and we're at last occurrence, don't schedule next
    if (occurrencesLeft === null || occurrencesLeft > 1) {
      const nextDue = computeNextDueDate(todo.due_date, r);

      // respect ends_on if set
      if (!r.ends_on || (nextDue && new Date(nextDue) <= new Date(r.ends_on))) {
        const newRecurrence = { ...r };
        if (occurrencesLeft !== null)
          newRecurrence.occurrences = occurrencesLeft - 1;

        const payload = {
          tenant_id: todo.tenant_id,
          title: todo.title,
          details: todo.details,
          has_due_date: true,
          due_date: nextDue,
          recurrence: newRecurrence,
          assign_to_user: todo.assign_to_user,
          user: todo.user,
          priority: todo.priority,
          client: todo.client,
          service: todo.service,
          status: "new",
          created_by: actor?.id || todo.created_by,
        };

        nextTodo = await createTodo(payload);
      }
    }
  }

  return { todo, nextTodo };
}
