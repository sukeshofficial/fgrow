import mongoose from "mongoose";
const { Schema } = mongoose;

const documentTypeSchema = new Schema(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        is_active: { type: Boolean, default: true },
        created_by: { type: Schema.Types.ObjectId, ref: "User" },
        updated_by: { type: Schema.Types.ObjectId, ref: "User" }
    },
    { timestamps: true }
);

documentTypeSchema.index({ tenant_id: 1, name: 1 }, { unique: true });

export default mongoose.model("DocumentType", documentTypeSchema);