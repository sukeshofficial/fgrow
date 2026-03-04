import mongoose from "mongoose";

const TagSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true
    },
    name: { type: String, required: true },
    color: String,
    description: String
}, { timestamps: true });

TagSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.model("Tag", TagSchema);