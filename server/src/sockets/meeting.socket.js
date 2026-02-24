import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";
import Meeting from "../models/meeting.model.js";
import MeetingParticipant from "../models/meetingParticipant.model.js";
import MeetingMessage from "../models/meetingMessage.model.js";
import { User } from "../models/user.model.js";

/**
 * Maintains mapping userId -> Set(socketId)
 * so we can target a user's sockets.
 */
const userSockets = new Map(); // Map<string, Set<string>>

export function initSocket(server, expressApp) {
    const io = new IOServer(server, {
        cors: {
            origin: process.env.CLIENT_ORIGIN,
            credentials: true,
        },
    });

    // Save io on express app so controllers can use it:
    expressApp.set("io", io);

    // Middleware — authenticate socket handshake
    io.use(async (socket, next) => {
        try {
            const token =
                // try cookie first
                (socket.handshake.headers?.cookie || "")
                    .split(";")
                    .map((c) => c.trim())
                    .find((c) => c.startsWith("auth_token="))
                    ?.split("=")[1] ||
                // then Authorization header
                (socket.handshake.auth && socket.handshake.auth.token) ||
                (socket.handshake.headers.authorization || "").replace("Bearer ", "");

            if (!token) {
                return next(new Error("Authentication error: token missing"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId || decoded.id || decoded._id;

            if (!userId) return next(new Error("Authentication error: invalid token"));

            // Load minimal user - to check locked status etc.
            const user = await User.findById(userId).select("_id name email role locked_until");
            if (!user) return next(new Error("Authentication error: user not found"));

            if (user.locked_until && user.locked_until.getTime() > Date.now()) {
                return next(new Error("Account locked"));
            }

            // attach to socket
            socket.user = { _id: user._id.toString(), name: user.name, role: user.role };

            // track socket
            const set = userSockets.get(socket.user._id) || new Set();
            set.add(socket.id);
            userSockets.set(socket.user._id, set);

            return next();
        } catch (err) {
            console.error("socket auth error:", err);
            return next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log("socket connected", socket.id, "user", socket.user?._id);

        // helpful helper
        const getUserSocketIds = (userId) => Array.from(userSockets.get(userId) || []);

        // JOIN MEETING (from client)
        // payload: { meetingId }
        socket.on("join-meeting", async (payload, cb) => {
            try {
                const { meetingId } = payload || {};
                if (!meetingId) return cb?.({ ok: false, message: "meetingId required" });

                const meeting = await Meeting.findById(meetingId);
                if (!meeting) return cb?.({ ok: false, message: "meeting not found" });

                // Ensure participant record exists; if not, create as viewer + status handling
                let participant = await MeetingParticipant.findOne({
                    meetingId,
                    userId: socket.user._id,
                });

                // If existing and left before, allow rejoin (set status to joined)
                if (participant && participant.status === "left") {
                    participant.status = meeting.settings?.waitingRoom && String(meeting.hostId) !== String(socket.user._id) ? "waiting" : "joined";
                    participant.isPresent = participant.status === "joined";
                    if (participant.status === "joined") participant.joinedAt = new Date();
                    await participant.save();
                } else if (!participant) {
                    const shouldWait = meeting.settings?.waitingRoom === true && String(meeting.hostId) !== String(socket.user._id);
                    participant = await MeetingParticipant.create({
                        meetingId,
                        userId: socket.user._id,
                        role: "viewer",
                        status: shouldWait ? "waiting" : "joined",
                        isPresent: !shouldWait,
                        joinedAt: shouldWait ? null : new Date(),
                    });
                }

                // add socket to meeting room if joined
                const room = `meeting_${meetingId}`;
                if (participant.status === "joined") {
                    socket.join(room);
                }

                // Notify host(s) if somebody is waiting
                if (participant.status === "waiting") {
                    // host sockets
                    const hostSockets = getUserSocketIds(String(meeting.hostId));
                    hostSockets.forEach((sid) =>
                        io.to(sid).emit("waiting-participant", {
                            participantId: participant._id,
                            userId: socket.user._id,
                            name: socket.user.name,
                        }),
                    );
                } else {
                    // broadcast to meeting that participant joined
                    io.to(room).emit("participant-joined", {
                        participantId: participant._id,
                        userId: socket.user._id,
                        name: socket.user.name,
                    });
                }

                return cb?.({ ok: true, participant });
            } catch (err) {
                console.error("join-meeting error:", err);
                return cb?.({ ok: false, message: "join failed" });
            }
        });

        // LEAVE MEETING (from client)
        // payload: { meetingId }
        socket.on("leave-meeting", async (payload, cb) => {
            try {
                const { meetingId } = payload || {};
                if (!meetingId) return cb?.({ ok: false, message: "meetingId required" });

                const participant = await MeetingParticipant.findOne({
                    meetingId,
                    userId: socket.user._id,
                });

                if (!participant) return cb?.({ ok: false, message: "not a participant" });

                if (participant.status === "left") {
                    return cb?.({ ok: true, message: "already left" });
                }

                participant.status = "left";
                participant.isPresent = false;
                participant.leftAt = new Date();
                await participant.save();

                const room = `meeting_${meetingId}`;
                socket.leave(room);

                // notify room
                io.to(room).emit("participant-left", {
                    participantId: participant._id,
                    userId: socket.user._id,
                    name: socket.user.name,
                });

                return cb?.({ ok: true, participant });
            } catch (err) {
                console.error("leave-meeting error:", err);
                return cb?.({ ok: false, message: "leave failed" });
            }
        });

        // CHAT MESSAGE
        // payload: { meetingId, message }
        socket.on("chat-message", async (payload, cb) => {
            try {
                const { meetingId, message } = payload || {};
                if (!meetingId || !message) return cb?.({ ok: false, message: "meetingId and message required" });

                // optional: verify user is allowed to chat (participant exists and allowChat true)
                const meeting = await Meeting.findById(meetingId);
                if (!meeting) return cb?.({ ok: false, message: "meeting not found" });

                if (!meeting.settings?.allowChat) {
                    return cb?.({ ok: false, message: "chat disabled" });
                }

                // store message
                const msg = await MeetingMessage.create({
                    meetingId,
                    senderId: socket.user._id,
                    message,
                    type: "text",
                });

                // broadcast to room
                const room = `meeting_${meetingId}`;
                io.to(room).emit("chat-message", {
                    _id: msg._id,
                    meetingId,
                    senderId: socket.user._id,
                    name: socket.user.name,
                    message,
                    createdAt: msg.createdAt,
                });

                return cb?.({ ok: true, msg });
            } catch (err) {
                console.error("chat-message error:", err);
                return cb?.({ ok: false, message: "chat failed" });
            }
        });

        // handle disconnect: remove socket id, update presence if no sockets remain
        socket.on("disconnect", async (reason) => {
            try {
                const uid = socket.user?._id;
                if (!uid) return;

                // remove socket id from map
                const set = userSockets.get(uid);
                if (set) {
                    set.delete(socket.id);
                    if (set.size === 0) {
                        userSockets.delete(uid);

                        // OPTIONAL: If you want to mark all participant records isPresent=false for this user
                        // find any meeting participants where isPresent true and set to false.
                        await MeetingParticipant.updateMany(
                            { userId: uid, isPresent: true, status: "joined" },
                            { $set: { isPresent: false } },
                        );

                        // broadcast participant-left for each meeting the user was in
                        // (we could query specific meetings to broadcast more precisely)
                        // Simple approach: you can query recent meeting participants and emit for each.
                    } else {
                        userSockets.set(uid, set);
                    }
                }

                console.log("socket disconnected", socket.id, "reason", reason);
            } catch (err) {
                console.error("disconnect handler error:", err);
            }
        });
    });

    return io;
}

// helper for controllers to send to a user's sockets
export function emitToUser(userId, event, payload, ioInstance) {
    const ids = Array.from(userSockets.get(String(userId)) || []);
    ids.forEach((sid) => {
        ioInstance.to(sid).emit(event, payload);
    });
}