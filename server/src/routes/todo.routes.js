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
const authStaff = [authMiddleware, requireRole("owner", "staff")];

// todo list & creation
router.post("/", ...authStaff, createTodoController);
router.get("/", ...authStaff, listTodosController);

// todo details
router.get("/:id", ...authStaff, getTodoByIdController);

// update todo
router.patch("/:id", ...authStaff, updateTodoController);

// delete todo
router.delete("/:id", ...authStaff, deleteTodoController);

// mark todo complete
router.patch("/:id/complete", ...authStaff, markTodoCompleteController);

export default router;
