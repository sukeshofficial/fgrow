import mongoose from "mongoose";

const { Schema } = mongoose;

const recurringItemSchema = new Schema({
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    frequency: { type: String },
    sac_code: { type: String },
    gst_rate: { type: Number, default: 0 },
    default_billing_rate: { type: Number, default: 0 },
    is_recurring: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    start_date: { type: Date },
    end_date: { type: Date },
    next_run: { type: Date },
});

export default recurringItemSchema;