import mongoose from "mongoose";

const { Schema } = mongoose;

const documentSchema = new Schema(
  {
    tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },

    date: { type: Date, required: true },

    category: {
      type: String,
      enum: ["given", "received"],
      required: true
    },

    document_type: {
      type: Schema.Types.ObjectId,
      ref: "DocumentType",
      required: true
    },

    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },

    location: { type: String, trim: true },

    is_returnable: { type: Boolean, default: false },

    returned: { type: Boolean, default: false },

    returned_on: { type: Date, default: null },

    notes: { type: String, trim: true },

    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },

    archived: { type: Boolean, default: false },
    archived_at: { type: Date, default: null }
  },
  { timestamps: true }
);

documentSchema.index({ tenant_id: 1, date: -1 });
documentSchema.index({ tenant_id: 1, client: 1 });

export default mongoose.model("Document", documentSchema);