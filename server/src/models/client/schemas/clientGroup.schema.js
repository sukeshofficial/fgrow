import mongoose from "mongoose";

const { Schema } = mongoose;

const ClientGroupSchema = new Schema(
    {
        tenant_id: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        color: {
            type: String,
            default: "#6B7280" // optional UI color
        },

        created_by: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        updated_by: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

/* prevent duplicate group names within tenant */
ClientGroupSchema.index({ tenant_id: 1, name: 1 }, { unique: true });

export default mongoose.model("ClientGroup", ClientGroupSchema);