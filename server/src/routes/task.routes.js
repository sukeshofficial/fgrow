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
  deleteTaskController,
} from "../controller/task.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import billingMiddleware from "../middleware/billing.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";
import { cacheMiddleware, clearCacheMiddleware } from "../middleware/cache.js";


const router = express.Router();

const authStaff = [authMiddleware, billingMiddleware, requireRole("owner", "staff")];

// task list & creation
router.get("/", ...authStaff, cacheMiddleware(300), listTasksController);
router.post("/", ...authStaff, clearCacheMiddleware("v0/tasks"), createTaskController);

// task details & update
router.get("/:id", ...authStaff, cacheMiddleware(300), getTaskController);
router.put("/:id", ...authStaff, clearCacheMiddleware("v0/tasks"), updateTaskController);
router.delete("/:id", ...authStaff, clearCacheMiddleware("v0/tasks"), deleteTaskController);


// task status
router.patch("/:id/status", ...authStaff, clearCacheMiddleware("v0/tasks"), updateStatusController);

// checklist management
router.post("/:id/checklist", ...authStaff, clearCacheMiddleware("v0/tasks"), addChecklistItemController);
router.patch("/:id/checklist/:idx", ...authStaff, clearCacheMiddleware("v0/tasks"), updateChecklistItemController);
router.delete("/:id/checklist/:idx", ...authStaff, clearCacheMiddleware("v0/tasks"), deleteChecklistItemController);

// time log management
router.post("/:id/timelogs/start", ...authStaff, clearCacheMiddleware("v0/tasks"), startTimelogController);
router.post("/:id/timelogs/stop", ...authStaff, clearCacheMiddleware("v0/tasks"), stopTimelogController);
router.post("/:id/timelogs", ...authStaff, clearCacheMiddleware("v0/tasks"), addTimelogController);

// task activity
router.get("/:id/activities", ...authStaff, getActivitiesController);

export default router;
