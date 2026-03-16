import mongoose from "mongoose";

const { Schema } = mongoose;

const dscSchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },

    class_type: {
      type: String,
      enum: ["Class 1", "Class 2", "Class 3"],
      required: true
    },

    password: { type: String, trim: true },
    issue_date: { type: Date, required: true },
    expiry_date: { type: Date, required: true },
    notes: { type: String, trim: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    archived: { type: Boolean, default: false },
    archived_at: { type: Date, default: null }

  },
  { timestamps: true }
);

dscSchema.index({ tenant_id: 1, client: 1 });

export default mongoose.model("DSC", dscSchema);