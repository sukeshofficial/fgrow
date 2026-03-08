import mongoose from "mongoose";

const { Schema } = mongoose;

const taskChecklistSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    is_done: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      default: 0,
    },

    completed_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    completed_at: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

export default taskChecklistSchema;
