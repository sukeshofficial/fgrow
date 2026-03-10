import mongoose from "mongoose";

const { Schema } = mongoose;

// NOTE: Same fix as invoiceItem.schema — removed `{ _id: false }` from options
// so subdocument _id values are generated and can be used for lookup/deletion.
const paymentSchema = new Schema({
  amount: { type: Number, required: true, min: [0.01, "Payment amount must be greater than 0"] },

  date: { type: Date, required: true },

  // bank_transfer | cheque | cash | razorpay | upi | other
  method: { type: String, trim: true },

  // Transaction ID, cheque number, etc.
  reference: { type: String, trim: true },

  note: { type: String, trim: true },

  created_by: { type: Schema.Types.ObjectId, ref: "User" },
});

export default paymentSchema;