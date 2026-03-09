import mongoose from "mongoose";
const { Schema } = mongoose;

const recurrenceSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    interval: { type: Number, default: 1 }, // e.g., every 2 (units)
    unit: {
      type: String,
      enum: ["day", "week", "month", "year"],
      default: "month",
    },
    // optional: until date or occurrences limit
    ends_on: { type: Date, default: null },
    occurrences: { type: Number, default: null }, // optional max occurrences
  },
  { _id: false },
);

export default recurrenceSchema;
