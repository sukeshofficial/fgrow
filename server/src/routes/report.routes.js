import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { createReport, getReports, updateReportStatus } from "../controller/report.controller.js";

const router = express.Router();

router.post("/", authMiddleware, upload.array('screenshots', 10), createReport);
router.get("/", authMiddleware, getReports);
router.put("/:id/status", authMiddleware, updateReportStatus);

export default router;
