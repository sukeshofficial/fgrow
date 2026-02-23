import Meeting from "../models/meeting.model.js";
import MeetingParticipant from "../models/meetingParticipant.model.js";
import { generateMeetingCode } from "../utils/helper.js";

/**
 * Create Meeiting
 */
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

/**
 * Join Meeiting
 */
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
    status: shouldWait ? "waiting" : "joined",
    joinedAt: participantStatus === "joined" ? new Date() : null,
  });

  return {
    meeting,
    participant,
    alreadyJoined: false,
  };
};

/**
 * List participants (optional filter by status)
 */
export const listParticipantsService = async ({ meetingId, status }) => {
  const query = { meetingId };
  if (status) query.status = status;
  return MeetingParticipant.find(query).populate(
    "userId",
    "name email profile_avatar",
  );
};

/**
 * Admit participant (host-only guard is checked at controller level too)
 */
export const admitParticipantService = async ({
  meetingId,
  participantId,
  actingUserId,
}) => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw { status: 404, message: "Meeting not found" };

  console.log("HOST ID (from meeting):", String(meeting.hostId));
  console.log("ACTING USER ID (from token):", String(actingUserId));

  // guard: only host can admit
  if (String(meeting.hostId) !== String(actingUserId)) {
    throw { status: 403, message: "Only host can admit participants" };
  }

  const participant = await MeetingParticipant.findOneAndUpdate(
    {
      _id: participantId,
      meetingId,
      status: "waiting",
    },
    {
      $set: {
        status: "joined",
        isPresent: true,
        joinedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!participant) {
    throw {
      status: 400,
      message: "Participant is not in waiting state or not found",
    };
  }

  if (participant.status === "joined") {
    return { alreadyJoined: true, participant };
  }

  if (participant.status !== "waiting") {
    throw {
      status: 400,
      message: `Participant cannot be admitted from status ${participant.status}`,
    };
  }

  participant.status = "joined";
  participant.isPresent = true;
  participant.joinedAt = new Date();
  await participant.save();

  return { participant, meeting };
};

/**
 * Reject participant (host-only)
 */
export const rejectParticipantService = async ({
  meetingId,
  participantId,
  actingUserId,
}) => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw { status: 404, message: "Meeting not found" };

  if (String(meeting.hostId) !== String(actingUserId)) {
    throw { status: 403, message: "Only host can reject participants" };
  }

  const participant = await MeetingParticipant.findById(participantId);
  if (!participant || String(participant.meetingId) !== String(meetingId)) {
    throw { status: 404, message: "Participant not found for this meeting" };
  }

  if (participant.status !== "waiting") {
    // you might still allow kicking joined users with a different flow
    throw {
      status: 400,
      message: `Participant cannot be rejected from status ${participant.status}`,
    };
  }

  participant.status = "rejected";
  participant.rejectedAt = new Date();
  await participant.save();

  return { participant, meeting };
};

/**
 * Leave meeting
 */
export const leaveMeetingService = async ({ meetingId, userId }) => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw { status: 404, message: "Meeting not found" };
  }

  const participant = await MeetingParticipant.findOne({
    meetingId,
    userId,
  });

  if (!participant) {
    throw { status: 404, message: "You are not a participant of this meeting" };
  }

  if (participant.status === "left") {
    return { alreadyLeft: true, participant };
  }

  participant.status = "left";
  participant.isPresent = false;
  participant.leftAt = new Date();

  await participant.save();

  return {
    alreadyLeft: false,
    participant,
    meeting,
  };
};
