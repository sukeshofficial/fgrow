import Meeting from "../models/meeting.model.js";
import MeetingParticipant from "../models/meetingParticipant.model.js";
import { generateMeetingCode } from "../utils/helper.js";

export const createMeetingService = async ({
  title,
  scheduledAt,
  waitingRoom,
  userId,
}) => {
  // 1. Generate unique meeting code
  let meetingCode;
  let exists = true;

  while (exists) {
    meetingCode = generateMeetingCode();
    exists = await Meeting.findOne({ meetingCode });
  }

  // 2. Create meeting
  const meeting = await Meeting.create({
    title,
    meetingCode,
    hostId: userId,
    scheduledAt,
    settings: {
      waitingRoom: waitingRoom ?? true,
    },
  });

  // 3. Add host as participant
  await MeetingParticipant.create({
    meetingId: meeting._id,
    userId,
    role: "host",
    status: "joined",
    joinedAt: new Date(),
  });

  return meeting;
};

export const joinMeetingService = async ({ meetingCode, userId }) => {
  // 1. Find meeting
  const meeting = await Meeting.findOne({ meetingCode });
  if (!meeting) {
    throw { status: 404, message: "Meeting not found" };
  }

  // 2. Check if already participant (and not left)
  const existingParticipant = await MeetingParticipant.findOne({
    meetingId: meeting._id,
    userId,
    status: { $ne: "left" },
  });

  if (existingParticipant) {
    return {
      meeting,
      participant: existingParticipant,
      alreadyJoined: true,
    };
  }

  // 3. Decide participant status
  const shouldWait =
    meeting.settings?.waitingRoom === true &&
    String(meeting.hostId) !== String(userId);

  const participantStatus = shouldWait ? "waiting" : "joined";

  // 4. Create participant
  const participant = await MeetingParticipant.create({
    meetingId: meeting._id,
    userId,
    role: "viewer",
    status: participantStatus,
    joinedAt: participantStatus === "joined" ? new Date() : null,
  });

  return {
    meeting,
    participant,
    alreadyJoined: false,
  };
};


