import express from "express";
import { listTasksController, createTaskController, getTaskController, updateTaskController, updateStatusController, addChecklistItemController, updateChecklistItemController, deleteChecklistItemController, startTimelogController, stopTimelogController, addTimelogController, getActivitiesController } from "../controller/task.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

/* ------------------ task list & creation ------------------ */

router.get("/", authMiddleware, requireRole("owner", "staff"), listTasksController);
router.post("/", authMiddleware, requireRole("owner", "staff"), createTaskController);

/* ------------------ task details & update ------------------ */

router.get("/:id", authMiddleware, requireRole("owner", "staff"), getTaskController);
router.put("/:id", authMiddleware, requireRole("owner", "staff"), updateTaskController);

/* ------------------ task status ------------------ */

router.patch("/:id/status", authMiddleware, requireRole("owner", "staff"), updateStatusController);

/* ------------------ checklist management ------------------ */

router.post("/:id/checklist", authMiddleware, requireRole("owner", "staff"), addChecklistItemController);
router.patch("/:id/checklist/:idx", authMiddleware, requireRole("owner", "staff"), updateChecklistItemController);
router.delete("/:id/checklist/:idx", authMiddleware, requireRole("owner", "staff"), deleteChecklistItemController);

/* ------------------ time log management ------------------ */

router.post("/:id/timelogs/start", authMiddleware, requireRole("owner", "staff"), startTimelogController);
router.post("/:id/timelogs/stop", authMiddleware, requireRole("owner", "staff"), stopTimelogController);
router.post("/:id/timelogs", authMiddleware, requireRole("owner", "staff"), addTimelogController);

/* ------------------ task activity ------------------ */

router.get("/:id/activities", authMiddleware, requireRole("owner", "staff"), getActivitiesController);

export default router;