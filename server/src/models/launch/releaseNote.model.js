import mongoose from "mongoose";

const releaseNoteSchema = new mongoose.Schema(
    {
        version: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["major", "minor", "patch"],
            default: "minor",
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        summary: {
            type: String,
            trim: true,
        },
        features: [
            {
                type: String,
                required: true,
            },
        ],
        isActive: {
            type: Boolean,
            default: false,
        },
        // Production Fields
        audience: {
            type: String,
            enum: ["all", "admins", "owners", "users"],
            default: "all",
        },
        status: {
            type: String,
            enum: ["draft", "scheduled", "published", "archived"],
            default: "draft",
        },
        publishAt: {
            type: Date,
            default: Date.now,
        },
        expireAt: {
            type: Date,
        },
        showOnLogin: {
            type: Boolean,
            default: true,
        },
        showAsModal: {
            type: Boolean,
            default: true,
        },
        showAsBanner: {
            type: Boolean,
            default: false,
        },
        requireAcknowledgement: {
            type: Boolean,
            default: false,
        },
        ctaLabel: {
            type: String,
        },
        ctaLink: {
            type: String,
        },
        icon: {
            type: String, // String identifier or URL
        },
        tags: [String],
        imageUrl: {
            type: String,
        },
        versionLabel: {
            type: String,
        },
        priority: {
            type: Number,
            default: 0,
        },
        internalNotes: {
            type: String,
        },
        changelogUrl: {
            type: String,
        },
        dismissible: {
            type: Boolean,
            default: true,
        },
        autoOpenDelaySeconds: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

const ReleaseNote = mongoose.model("ReleaseNote", releaseNoteSchema);
export default ReleaseNote;
