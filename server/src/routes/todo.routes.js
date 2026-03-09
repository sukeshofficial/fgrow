import express from "express";
import {
  createTodoController,
  listTodosController,
  getTodoByIdController,
  updateTodoController,
  deleteTodoController,
  markTodoCompleteController,
} from "../controller/todo.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

/* ------------------ todo list & creation ------------------ */

router.post(
  "/",
  authMiddleware,
  requireRole("owner", "staff"),
  createTodoController,
);
router.get(
  "/",
  authMiddleware,
  requireRole("owner", "staff"),
  listTodosController,
);

/* ------------------ todo details ------------------ */

router.get(
  "/:id",
  authMiddleware,
  requireRole("owner", "staff"),
  getTodoByIdController,
);

/* ------------------ update todo ------------------ */

router.patch(
  "/:id",
  authMiddleware,
  requireRole("owner", "staff"),
  updateTodoController,
);

/* ------------------ delete todo ------------------ */

router.delete(
  "/:id",
  authMiddleware,
  requireRole("owner", "staff"),
  deleteTodoController,
);

/* ------------------ mark todo complete ------------------ */

router.patch(
  "/:id/complete",
  authMiddleware,
  requireRole("owner", "staff"),
  markTodoCompleteController,
);

export default router;
