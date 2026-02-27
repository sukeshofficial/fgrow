import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["Free", "Basic", "Pro", "Enterprise"],
      required: true,
    },
    priceMonthly: Number,
    priceYearly: Number,
    maxUsers: Number,
    maxClients: Number,
    features: {
      type: Object,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Plan", planSchema);
