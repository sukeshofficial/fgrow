import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        tenant_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        subscription_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription",
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        gateway: {
            type: String,
            default: "razorpay",
        },
        razorpay_order_id: {
            type: String,
            required: true,
            unique: true,
        },
        razorpay_payment_id: {
            type: String,
        },
        razorpay_signature: {
            type: String,
        },
        status: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
        },
        webhook_logs: [
            {
                event: String,
                payload: Object,
                received_at: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
