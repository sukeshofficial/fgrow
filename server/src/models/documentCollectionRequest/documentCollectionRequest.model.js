// models/collectionRequest.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const requestDocumentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },

    // optional metadata about the uploaded document (from file uploads)
    key: { type: String, trim: true }, // storage public id (cloudinary / s3 key)
    url: { type: String, trim: true },
    name: { type: String, trim: true },
    size: { type: Number },
    mime: { type: String, trim: true },
    uploaded_by: { type: Schema.Types.ObjectId, ref: "User" },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: false },
);

const collectionRequestSchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    // optional human readable request number (you can add a counter later)
    request_no: { type: String, trim: true, index: true },

    // status shown in UI
    status: {
      type: String,
      enum: ["open", "in_progress", "closed", "cancelled"],
      default: "open",
      index: true,
    },

    // which client the request is for
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    // task: either a free-text or reference to some Task master; using String for simplicity
    task: { type: String, required: true, trim: true },

    // message/instructions to client
    message: { type: String, required: true, trim: true },

    // optional due date for collection (if UI needs it)
    due_date: { type: Date, default: null },

    // uploaded documents metadata array
    documents: [requestDocumentSchema],

    // computed counters (stored for quick access)
    documents_count: { type: Number, default: 0 },

    // optional assignee (staff) for this request
    assigned_to: { type: Schema.Types.ObjectId, ref: "User", default: null },

    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },

    archived: { type: Boolean, default: false },
    archived_at: { type: Date, default: null },
  },
  { timestamps: true },
);

collectionRequestSchema.index({ tenant_id: 1, status: 1 });
collectionRequestSchema.index(
  { tenant_id: 1, request_no: 1 },
  { unique: false },
);

export default mongoose.model("CollectionRequest", collectionRequestSchema);
