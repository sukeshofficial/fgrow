import mongoose from "mongoose";

const { Schema } = mongoose;

// NOTE: _id: false is removed from options so Mongoose generates _id automatically.
// Defining `_id` manually inside the schema while also passing `{ _id: false }` in options
// is contradictory — Mongoose honours the options flag and ignores the field definition.
const invoiceItemSchema = new Schema({
  type: {
    type: String,
    enum: ["task", "expense", "retainer", "manual"],
    required: true,
  },

  description: { type: String, required: true, trim: true },

  quantity: { type: Number, default: 1, min: 0 },

  unit_price: { type: Number, default: 0, min: 0 },

  // Flat discount amount (₹)
  discount: { type: Number, default: 0, min: 0 },

  // GST rate in percent (e.g. 18 for 18%)
  gst_rate: { type: Number, default: 0, min: 0 },

  // Computed and stored for fast reads — recalculated by computeInvoiceTotals
  gst_amount: { type: Number, default: 0 },

  total_amount: { type: Number, default: 0 },

  // Optional reference to the originating entity (Task, Expense, etc.)
  source_id: { type: Schema.Types.ObjectId, default: null },

  meta: { type: Schema.Types.Mixed, default: {} },
});

export default invoiceItemSchema;