import mongoose from "mongoose";

import fileSchema from "../schemas/serviceFile.schema.js";
import taskChecklistSchema from "./schemas/taskChecklist.schema.js";
import taskTimelogSchema from "./schemas/taskTimelog.schema.js";

const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    // core relations
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },

    // basic fields
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // dates
    creation_date: {
      type: Date,
      default: Date.now,
      index: true,
    },

    due_date: {
      type: Date,
      default: null,
      index: true,
    },

    target_date: {
      type: Date,
      default: null,
      index: true,
    },

    completed_at: {
      type: Date,
      default: null,
    },

    // assignment
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],

    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
        index: true,
      },
    ],

    // sub structures
    checklist: [taskChecklistSchema],
    timelogs: [taskTimelogSchema],
    supporting_files: [fileSchema],

    // bookkeeping
    is_billable: {
      type: Boolean,
      default: false,
    },

    create_doc_request: {
      type: Boolean,
      default: false,
    },

    doc_request_message: {
      type: String,
      trim: true,
    },

    // status
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "verified", "cancelled"],
      default: "pending",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    // audit
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updated_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    archived: {
      type: Boolean,
      default: false,
    },

    archived_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

taskSchema.index({ tenant_id: 1, client: 1 });
taskSchema.index({ tenant_id: 1, service: 1 });

export default mongoose.model("Task", taskSchema);
