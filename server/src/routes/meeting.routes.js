/**
 * Meeting Routes
 * --------------
 * Defines all HTTP routes related to meetings and participants.
 */

import express from "express";
import {
  createMeeting,
  joinMeeting,
  listParticipants,
  admitParticipant,
  rejectParticipant,
  leaveMeeting,
} from "../controller/meeting.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Create a new meeting
 * POST /api/v0/meetings
 */
router.post("/", authMiddleware, createMeeting);

/**
 * Join a meeting using meeting code
 * POST /api/v0/meetings/:code/join
 */
router.post("/:code/join", authMiddleware, joinMeeting);

/**
 * List participants of a meeting
 * GET /api/v0/meetings/:id/participants
 * Optional query: ?status=waiting
 */
router.get("/:id/participants", authMiddleware, listParticipants);

/**
 * Admit a participant from waiting room
 * POST /api/v0/meetings/:id/admit
 * Body: { participantId }
 */
router.post("/:id/admit", authMiddleware, admitParticipant);

/**
 * Reject a participant from waiting room
 * POST /api/v0/meetings/:id/reject
 * Body: { participantId }
 */
router.post("/:id/reject", authMiddleware, rejectParticipant);

router.post("/:id/leave", authMiddleware, leaveMeeting);

export default router;
