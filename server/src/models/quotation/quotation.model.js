// models/quotation.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const quotationItemSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    service_id: { type: Schema.Types.ObjectId, ref: "Service", default: null },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1 },
    unit_price: { type: Number, default: 0 },
    gst_rate: { type: Number, default: 0 }, // percentage, e.g., 18
    gst_amount: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 }, // (quantity*unit_price) + gst - discounts (if any)
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const quotationSchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    quotation_no: { type: String, required: true, trim: true, index: true }, // e.g. TVRA 25-26/012
    billing_entity: {
      type: Schema.Types.ObjectId,
      ref: "BillingEntity",
      required: true,
    },

    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    date: { type: Date, required: true, default: Date.now },
    valid_until: { type: Date, default: null },

    items: [quotationItemSchema],

    subtotal: { type: Number, default: 0 },
    total_gst: { type: Number, default: 0 },
    round_off: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },

    terms: { type: String, trim: true },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },

    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },

    archived: { type: Boolean, default: false },
    archived_at: { type: Date, default: null },
  },
  { timestamps: true },
);

quotationSchema.index({ tenant_id: 1, quotation_no: 1 }, { unique: true });
quotationSchema.index({ tenant_id: 1, client: 1 });
quotationSchema.index({ tenant_id: 1, date: -1 });

export default mongoose.model("Quotation", quotationSchema);
