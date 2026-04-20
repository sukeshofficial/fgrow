import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["bug", "feature_request", "general_feedback"],
            required: true,
            default: "bug"
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "resolved"],
            default: "pending"
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: false
        },
        screenshots: [{
            type: String
        }],
        resolution: {
            title: { type: String, trim: true },
            description: { type: String },
            screenshots: [{ type: String }],
            resolvedAt: { type: Date }
        }
    },
    { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);
