import mongoose from "mongoose";

const { Schema } = mongoose;

const expenseCategorySchema = new Schema(
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
    },

    description: {
      type: String,
      trim: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

expenseCategorySchema.index({ tenant_id: 1, name: 1 }, { unique: true });

export default mongoose.model("ExpenseCategory", expenseCategorySchema);
