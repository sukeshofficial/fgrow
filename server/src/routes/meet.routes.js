// routes/meet.routes.js
import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createMeeting,
  getMeeting,
  joinMeeting,
  updateParticipantRole,
  leaveMeeting
} from "../controllers/meet.controller.js";

const router = Router();

// Anyone authenticated can create/join/list meetings per your product rules
router.post("/", authMiddleware, createMeeting); // POST /api/meet
router.get("/:id", authMiddleware, getMeeting); // GET /api/meet/:id
router.post("/:id/join", authMiddleware, joinMeeting); // POST /api/meet/:id/join
router.patch("/:id/participant/:userId/role", authMiddleware, updateParticipantRole); // PATCH /api/meet/:id/participant/:userId/role
router.post("/:id/leave", authMiddleware, leaveMeeting); // POST /api/meet/:id/leave

export default router;
