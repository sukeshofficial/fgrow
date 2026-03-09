import mongoose from "mongoose";
import recurrenceSchema from "./schemas/recurrence.schema.js";

const { Schema } = mongoose;

const todoSchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true, index: true },
    details: { type: String, trim: true },

    // optional due date
    has_due_date: { type: Boolean, default: false },
    due_date: { type: Date, default: null, index: true },

    // recurrence config
    recurrence: { type: recurrenceSchema, default: () => ({}) },

    // assignment
    assign_to_user: { type: Boolean, default: false },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // bookkeeping
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    completed_at: { type: Date, default: null },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    // optional link to client or service (IDs only)
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      default: null,
      index: true,
    },

    // soft delete and audit
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    archived: { type: Boolean, default: false },
    archived_at: { type: Date, default: null },
  },
  { timestamps: true },
);

// helpful compound indexes
todoSchema.index({ tenant_id: 1, user: 1, status: 1 });
todoSchema.index({ tenant_id: 1, client: 1 });

export default mongoose.model("Todo", todoSchema);
