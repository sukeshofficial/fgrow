/**
 * Meeting Controller
 * ------------------
 * Handles HTTP requests related to meetings:
 * - Create meeting
 * - Join meeting
 * - List participants
 * - Admit / Reject participants
 */

import {
  createMeetingService,
  joinMeetingService,
  listParticipantsService,
  admitParticipantService,
  rejectParticipantService,
  leaveMeetingService,
} from "../services/meeting.service.js";

/**
 * Create a new meeting
 * POST /api/v0/meetings
 */
export const createMeeting = async (req, res) => {
  try {
    const { title, scheduledAt, waitingRoom } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        message: "Meeting title is required",
      });
    }

    // Create meeting
    const meeting = await createMeetingService({
      title,
      scheduledAt,
      waitingRoom,
      userId,
    });

    return res.status(201).json({
      message: "Meeting created successfully",
      meeting,
    });
  } catch (error) {
    console.error("Create meeting error:", error);

    return res.status(500).json({
      message: "Failed to create meeting",
    });
  }
};

/**
 * Join a meeting using meeting code
 * POST /api/v0/meetings/:code/join
 */
export const joinMeeting = async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.user.id;

    // Attempt to join meeting
    const result = await joinMeetingService({
      meetingCode: code,
      userId,
    });

    const { meeting, participant, alreadyJoined } = result;

    return res.status(200).json({
      message: alreadyJoined
        ? "Already joined meeting"
        : participant.status === "waiting"
          ? "Waiting for host approval"
          : "Joined meeting successfully",
      meeting: {
        id: meeting._id,
        title: meeting.title,
        status: meeting.status,
      },
      participant,
    });
  } catch (error) {
    console.error("Join meeting error:", error);

    return res.status(error.status || 500).json({
      message: error.message || "Failed to join meeting",
    });
  }
};

/**
 * List participants in a meeting
 * GET /api/v0/meetings/:id/participants
 * Optional query: ?status=waiting
 */
export const listParticipants = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const status = req.query.status; // optional filter

    const participants = await listParticipantsService({
      meetingId,
      status,
    });

    return res.status(200).json({ participants });
  } catch (error) {
    console.error("listParticipants error:", error);

    return res.status(error.status || 500).json({
      message: error.message || "Failed to list participants",
    });
  }
};

/**
 * Admit a participant from waiting room
 * POST /api/v0/meetings/:id/admit
 * Body: { participantId }
 */
export const admitParticipant = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const { participantId } = req.body;
    const actingUserId = req.user.id;

    // Validate input
    if (!participantId) {
      return res.status(400).json({
        message: "participantId is required",
      });
    }

    const { participant, alreadyJoined } = await admitParticipantService({
      meetingId,
      participantId,
      actingUserId,
    });

    return res.status(200).json({
      message: alreadyJoined
        ? "Participant already joined"
        : "Participant admitted",
      participant,
    });
  } catch (error) {
    console.error("admitParticipant error:", error);

    return res.status(error.status || 500).json({
      message: error.message || "Failed to admit participant",
    });
  }
};

/**
 * Reject a participant from waiting room
 * POST /api/v0/meetings/:id/reject
 * Body: { participantId }
 */
export const rejectParticipant = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const { participantId } = req.body;
    const actingUserId = req.user.id;

    // Validate input
    if (!participantId) {
      return res.status(400).json({
        message: "participantId is required",
      });
    }

    const { participant } = await rejectParticipantService({
      meetingId,
      participantId,
      actingUserId,
    });

    return res.status(200).json({
      message: "Participant rejected",
      participant,
    });
  } catch (error) {
    console.error("rejectParticipant error:", error);

    return res.status(error.status || 500).json({
      message: error.message || "Failed to reject participant",
    });
  }
};

export const leaveMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id;

    const { alreadyLeft, participant } = await leaveMeetingService({
      meetingId,
      userId,
    });

    return res.status(200).json({
      message: alreadyLeft
        ? "You already left the meeting"
        : "Left meeting successfully",
      participant,
    });
  } catch (err) {
    console.error("leaveMeeting error:", err);
    res.status(err.status || 500).json({
      message: err.message || "Failed to leave meeting",
    });
  }
};
