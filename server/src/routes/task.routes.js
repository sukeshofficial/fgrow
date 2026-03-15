import express from "express";
import {
  listTasksController,
  createTaskController,
  getTaskController,
  updateTaskController,
  updateStatusController,
  addChecklistItemController,
  updateChecklistItemController,
  deleteChecklistItemController,
  startTimelogController,
  stopTimelogController,
  addTimelogController,
  getActivitiesController,
} from "../controller/task.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

const authStaff = [authMiddleware, requireRole("owner", "staff")];

// task list & creation
router.get("/", ...authStaff, listTasksController);
router.post("/", ...authStaff, createTaskController);

// task details & update
router.get("/:id", ...authStaff, getTaskController);
router.put("/:id", ...authStaff, updateTaskController);

// task status
router.patch("/:id/status", ...authStaff, updateStatusController);

// checklist management
router.post("/:id/checklist", ...authStaff, addChecklistItemController);
router.patch("/:id/checklist/:idx", ...authStaff, updateChecklistItemController);
router.delete("/:id/checklist/:idx", ...authStaff, deleteChecklistItemController);

// time log management
router.post("/:id/timelogs/start", ...authStaff, startTimelogController);
router.post("/:id/timelogs/stop", ...authStaff, stopTimelogController);
router.post("/:id/timelogs", ...authStaff, addTimelogController);

// task activity
router.get("/:id/activities", ...authStaff, getActivitiesController);

export default router;
