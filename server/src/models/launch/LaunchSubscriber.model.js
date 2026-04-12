import mongoose from "mongoose";

const launchSubscriberSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"],
        },
        ipAddress: String,
        userAgent: String,
        notified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

export const LaunchSubscriber = mongoose.model("LaunchSubscriber", launchSubscriberSchema);
