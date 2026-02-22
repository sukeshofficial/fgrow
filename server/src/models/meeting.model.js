import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    meetingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "waiting", "live", "ended"],
      default: "scheduled",
    },

    scheduledAt: Date,
    startedAt: Date,
    endedAt: Date,

    settings: {
      waitingRoom: { type: Boolean, default: true },
      allowChat: { type: Boolean, default: true },
      allowRecording: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Meeting", meetingSchema);
