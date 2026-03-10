import mongoose from "mongoose";

const { Schema } = mongoose;

const invoiceItemSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },

    type: {
      type: String,
      enum: ["task", "expense", "retainer", "manual"],
      required: true,
    },

    description: { type: String, required: true, trim: true },

    quantity: { type: Number, default: 1 },

    unit_price: { type: Number, default: 0 },

    discount: { type: Number, default: 0 },

    gst_rate: { type: Number, default: 0 },

    gst_amount: { type: Number, default: 0 },

    total_amount: { type: Number, default: 0 },

    // optional references to source entities
    source_id: { type: Schema.Types.ObjectId, default: null },

    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

export default invoiceItemSchema;
