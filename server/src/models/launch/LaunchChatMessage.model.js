import mongoose from "mongoose";

const launchChatMessageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for performance
launchChatMessageSchema.index({ createdAt: -1 });

export const LaunchChatMessage = mongoose.model("LaunchChatMessage", launchChatMessageSchema);
