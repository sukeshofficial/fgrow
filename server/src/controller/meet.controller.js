// controllers/meet.controller.js
import { Meeting } from "../models/Meeting.js"; // your Meeting model file. See source. :contentReference[oaicite:7]{index=7}
import { User } from "../config/userModel.js";

/**
 * Create a meeting
 * - Host becomes first participant with role 'host' and isPending false
 */
export const createMeeting = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { title, startsAt, defaultEditors = [] } = req.body;
    if (!title) return res.status(400).json({ message: "title required" });

    const meeting = new Meeting({
      title,
      host: hostId,
      participants: [{
        user: hostId,
        role: "host",
        isPending: false,
        joinedAt: new Date(),
        lastSeen: new Date()
      }],
      startsAt: startsAt ? new Date(startsAt) : null,
      defaultEditors: defaultEditors // array of user ids (validate below)
    });

    // Optional validation of defaultEditors: ensure they exist
    if (defaultEditors && defaultEditors.length) {
      const users = await User.find({ _id: { $in: defaultEditors } }).select("_id").lean();
      // filter to existing user ids only
      meeting.defaultEditors = users.map(u => u._id);
    }

    await meeting.save();
    return res.status(201).json({ message: "meeting created", meeting });
  } catch (err) {
    console.error("createMeeting error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * Get meeting by id (populate participants' user basic info)
 */
export const getMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id)
      .populate("host", "displayName username profile_avatar")
      .populate("participants.user", "displayName username profile_avatar")
      .lean();

    if (!meeting) return res.status(404).json({ message: "meeting not found" });
    return res.status(200).json({ meeting });
  } catch (err) {
    console.error("getMeeting error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * Join meeting (adds participant as pending by default)
 */
export const joinMeeting = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // meeting id

    const meeting = await Meeting.findById(id);
    if (!meeting) return res.status(404).json({ message: "meeting not found" });

    // don't add duplicate
    const exists = meeting.participants.find(p => p.user.toString() === userId);
    if (exists) {
      // if exists but isPending true -> mark as joined
      if (exists.isPending) {
        exists.isPending = false;
        exists.joinedAt = new Date();
      }
      exists.lastSeen = new Date();
    } else {
      meeting.participants.push({
        user: userId,
        role: "user",
        isPending: true // waiting room until host admits (unless you auto-join)
      });
    }

    await meeting.save();
    return res.status(200).json({ message: "join request recorded", meetingId: meeting._id });
  } catch (err) {
    console.error("joinMeeting error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * Update participant role (only host or admin can do this)
 */
export const updateParticipantRole = async (req, res) => {
  try {
    const { id, userId } = req.params; // meeting id, participant user id
    const { role } = req.body;
    const allowedRoles = ["host", "editor", "user"];
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: "invalid role" });

    const meeting = await Meeting.findById(id);
    if (!meeting) return res.status(404).json({ message: "meeting not found" });

    // Check permission: only meeting.host === req.user.id or admin
    const requester = req.user;
    if (meeting.host.toString() !== requester.id && requester.role !== "admin") {
      return res.status(403).json({ message: "only host or admin can change roles" });
    }

    const member = meeting.participants.find(p => p.user.toString() === userId);
    if (!member) return res.status(404).json({ message: "participant not found" });

    member.role = role;
    await meeting.save();
    return res.status(200).json({ message: "participant role updated", member });
  } catch (err) {
    console.error("updateParticipantRole error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * Leave meeting (user removes themselves)
 */
export const leaveMeeting = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const meeting = await Meeting.findById(id);
    if (!meeting) return res.status(404).json({ message: "meeting not found" });

    const idx = meeting.participants.findIndex(p => p.user.toString() === userId);
    if (idx === -1) return res.status(404).json({ message: "participant not found in meeting" });

    // If host is leaving: either prevent or transfer host (we'll require host transfer)
    if (meeting.participants[idx].role === "host") {
      return res.status(400).json({ message: "host cannot leave without transferring host role" });
    }

    meeting.participants.splice(idx, 1);
    await meeting.save();
    return res.status(200).json({ message: "left meeting" });
  } catch (err) {
    console.error("leaveMeeting error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/* Nice to have:
 - Admit / reject pending participants endpoints for host
 - Webhook / socket integration for live meeting events
 - Pagination for participants & meetings
*/
