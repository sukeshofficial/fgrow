import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * One document per tenant per year.
 * Used to generate sequential receipt numbers safely.
 *
 * Example document:
 * {
 *   tenant_id: ObjectId("..."),
 *   year: 2026,
 *   seq: 128
 * }
 */

const receiptCounterSchema = new Schema(
    {
        tenant_id: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        seq: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: false }
);

// One counter document per tenant per year
receiptCounterSchema.index({ tenant_id: 1, year: 1 }, { unique: true });

export default mongoose.model("ReceiptCounter", receiptCounterSchema);