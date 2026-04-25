import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// We'll manage settings as key-value pairs in this collection (e.g., 'feedback_logout_interval': 10)
export const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);
