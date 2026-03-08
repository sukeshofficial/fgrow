import mongoose from "mongoose";
const { Schema } = mongoose;

const taskActivitySchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    activity_type: { type: String, required: true }, // e.g. "created", "status_changed", "checklist_updated", "timelog_added"
    detail: { type: String, trim: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

taskActivitySchema.index({ tenant_id: 1, task: 1, createdAt: -1 });

export default mongoose.model("TaskActivity", taskActivitySchema);
