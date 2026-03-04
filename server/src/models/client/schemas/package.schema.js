import mongoose from "mongoose";

const { Schema } = mongoose;

const packageSchema = new Schema({
    packageId: { type: Schema.Types.ObjectId, ref: "Package" },
    name: String,
    period_from: Date,
    period_to: Date,
    billed: { type: Boolean, default: false },
    auto_billing: { type: Boolean, default: false },
    items: [
        {
            service: { type: Schema.Types.ObjectId, ref: "Service" },
            qty: Number
        }
    ],
});

export default packageSchema;