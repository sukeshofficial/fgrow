import { createMeetingService } from "../services/meeting.service.js";
import { joinMeetingService } from "../services/meeting.service.js";

export const createMeeting = async (req, res) => {
  try {
    const { title, scheduledAt, waitingRoom } = req.body;
    const userId = req.user.id;
    console.log(req.user)

    if (!title) {
      return res.status(400).json({
        message: "Meeting title is required",
      });
    }

    const meeting = await createMeetingService({
      title,
      scheduledAt,
      waitingRoom,
      userId,
    });

    res.status(201).json({
      message: "Meeting created successfully",
      meeting,
    });
  } catch (error) {
    console.error("Create meeting error:", error);
    res.status(500).json({
      message: "Failed to create meeting",
    });
  }
};

export const joinMeeting = async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.user.id;

    const result = await joinMeetingService({
      meetingCode: code,
      userId,
    });

    const { meeting, participant, alreadyJoined } = result;

    res.status(200).json({
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

    res.status(error.status || 500).json({
      message: error.message || "Failed to join meeting",
    });
  }
};
