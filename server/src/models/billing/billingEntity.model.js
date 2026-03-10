import mongoose from "mongoose";

const { Schema } = mongoose;

const billingEntitySchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },

    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("BillingEntity", billingEntitySchema);
