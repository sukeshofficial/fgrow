import mongoose from "mongoose";

/**
 * SupportRequest Model
 * 
 * Purpose:
 * - Store in-app support messages from tenants.
 * - Store payment proofs (Transaction ID + Screenshot) submitted by tenants.
 * - Allow Super Admins to track and resolve these requests.
 */
const supportRequestSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["support", "payment_proof"],
            default: "support",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            required: true,
            trim: true,
        },
        screenshotUrl: {
            type: String, // Cloudinary URL
            default: null,
        },
        transactionId: {
            type: String, // For payment_proof type
            trim: true,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "resolved"],
            default: "pending",
        },
        adminResponse: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model("SupportRequest", supportRequestSchema);
