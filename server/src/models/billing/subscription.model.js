import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        tenant_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            unique: true,
        },
        plan_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "active", "expired", "cancelled"],
            default: "pending",
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        trial_start_at: {
            type: Date,
        },
        trial_end_at: {
            type: Date,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
