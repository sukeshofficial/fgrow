import mongoose from "mongoose";

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },

    amount: { type: Number, required: true },

    date: { type: Date, required: true },

    method: { type: String, trim: true }, // bank_transfer, cheque, cash, razorpay

    reference: { type: String, trim: true }, // txn id

    note: { type: String, trim: true },

    created_by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

export default paymentSchema;
