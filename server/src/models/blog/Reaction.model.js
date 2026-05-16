// server/src/models/blog/Reaction.model.js
import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        targetType: {
            type: String,
            enum: ["BlogPost", "Comment"],
            required: true,
        },
        type: {
            type: String,
            enum: ["like", "dislike"],
            required: true,
        },
    },
    { timestamps: true }
);

// Unique reaction per user per target
reactionSchema.index({ userId: 1, targetId: 1 }, { unique: true });

export const Reaction = mongoose.model("Reaction", reactionSchema);
