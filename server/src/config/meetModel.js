// models/Meeting.js
import mongoose from 'mongoose';

const MeetingMember = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['host', 'editor', 'user'], default: 'user' },
    isPending: { type: Boolean, default: true }, // waiting room
    joinedAt: { type: Date },
    lastSeen: { type: Date }
}, { _id: false });

const meetingSchema = new mongoose.Schema({
    title: String,
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [MeetingMember],
    startsAt: Date,
    isActive: { type: Boolean, default: false },
    // optional: meeting-level default editors (template)
    defaultEditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export const Meeting = mongoose.model('Meeting', meetingSchema);
