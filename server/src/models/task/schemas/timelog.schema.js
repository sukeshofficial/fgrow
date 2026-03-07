// models/task/schemas/timelog.schema.js
import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Timelog schema (embedded)
 * Matches original timelogSchema from task.model.js
 */
const timelogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, default: null },
    duration_minutes: { type: Number, default: 0 },
    note: { type: String, trim: true },
  },
  { _id: false },
);

export default timelogSchema;
