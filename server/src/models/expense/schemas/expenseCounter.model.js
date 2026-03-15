// models/expense/schemas/expenseCounter.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * One document per tenant per financial-year start.
 * year = financial-year-start (e.g. 2025 => FY 25-26 which is Apr 1, 2025 -> Mar 31, 2026)
 *
 * Example:
 * { tenant_id: ObjectId(...), year: 2025, seq: 12 }
 */
const expenseCounterSchema = new Schema(
  {
    tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    year: { type: Number, required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: false },
);

expenseCounterSchema.index({ tenant_id: 1, year: 1 }, { unique: true });

export default mongoose.model("ExpenseCounter", expenseCounterSchema);
