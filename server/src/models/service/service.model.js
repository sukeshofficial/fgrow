import mongoose from "mongoose";

import checklistSchema from "../schemas/serviceChecklist.schema.js";
import subtaskSchema from "../schemas/serviceSubtask.schema.js";
import fileSchema from "../schemas/serviceFile.schema.js";
import customFieldSchema from "../schemas/customField.schema.js";

const { Schema } = mongoose;

const serviceSchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    is_enabled: {
      type: Boolean,
      default: true,
    },

    checklist_required: {
      type: Boolean,
      default: false,
    },

    is_recurring: {
      type: Boolean,
      default: false,
    },

    // Billing Settings
    sac_code: {
      type: String,
      trim: true,
    },

    gst_rate: {
      type: Number,
      default: 0,
    },

    default_billing_rate: {
      type: Number,
      default: 0,
    },

    billable_by_default: {
      type: Boolean,
      default: true,
    },

    // GST API configuration (only for recurring services)
    gst_api_config: {
      enabled: {
        type: Boolean,
        default: false,
      },
      config: Schema.Types.Mixed,
    },

    // Document collection automation
    document_request_auto: {
      type: Boolean,
      default: false,
    },

    // Service Workflow Templates
    checklists: [checklistSchema],

    subtasks: [subtaskSchema],

    custom_fields: [customFieldSchema],

    supporting_files: [fileSchema],

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
  },
  { timestamps: true }
);

// Prevent duplicate services inside same tenant
serviceSchema.index({ tenant_id: 1, name: 1 }, { unique: true });

export default mongoose.model("Service", serviceSchema);