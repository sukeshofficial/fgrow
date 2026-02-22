import mongoose from "mongoose";

const meetingParticipantSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["host", "cohost", "editor", "viewer"],
      default: "viewer",
    },
    isPresent: { type: Boolean, default: false },
    joinedAt: Date,
    leftAt: Date,
  },
  { timestamps: true },
);

meetingParticipantSchema.index({ meetingId: 1, userId: 1 }, { unique: true });

export default mongoose.model("MeetingParticipant", meetingParticipantSchema);
