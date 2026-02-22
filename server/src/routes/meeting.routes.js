import express from "express";
import {
  createMeeting,
  joinMeeting,
} from "../controller/meeting.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createMeeting);
router.post("/:code/join", authMiddleware, joinMeeting);

export default router;
