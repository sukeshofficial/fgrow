import mongoose from "mongoose"; // removed unused `mongo` named import
import invoiceItemSchema from "./schemas/invoiceItem.schema.js";
import paymentSchema from "./schemas/payment.schema.js";

const { Schema } = mongoose;

const invoiceSchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    invoice_no: {
      type: String,
      required: true,
      trim: true,
    },

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

    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    due_date: {
      type: Date,
      default: null,
      index: true,
    },

    payment_term: { type: String, trim: true },

    items: [invoiceItemSchema],

    // calculations stored for fast reads
    subtotal: { type: Number, default: 0 },
    total_gst: { type: Number, default: 0 },
    discount_total: { type: Number, default: 0 },
    round_off: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },

    // payments
    payments: [paymentSchema],

    amount_received: { type: Number, default: 0 },

    balance_due: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["draft", "sent", "partially_paid", "paid", "cancelled"],
      default: "draft",
      index: true,
    },

    remark: { type: String, trim: true },

    created_by: { type: Schema.Types.ObjectId, ref: "User" },

    updated_by: { type: Schema.Types.ObjectId, ref: "User" },

    archived: { type: Boolean, default: false },

    archived_at: { type: Date, default: null },

    archived_by: { type: Schema.Types.ObjectId, ref: "User" },

    linked_sources: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true },
);

// Compound unique index — invoice_no must be unique per tenant
invoiceSchema.index({ tenant_id: 1, invoice_no: 1 }, { unique: true });
invoiceSchema.index({ tenant_id: 1, client: 1 });
invoiceSchema.index({ tenant_id: 1, date: -1 });
invoiceSchema.index({ tenant_id: 1, status: 1 });

export default mongoose.model("Invoice", invoiceSchema);
