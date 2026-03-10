import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * One document per tenant per year.
 * The `seq` field is incremented atomically via findOneAndUpdate + $inc,
 * so concurrent invoice creation can never produce duplicate numbers.
 *
 * Document shape: { tenant_id, year, seq }
 * e.g.          : { tenant_id: ObjectId("..."), year: 2024, seq: 42 }
 */
const invoiceCounterSchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: false },
);

// One counter document per tenant per year
invoiceCounterSchema.index({ tenant_id: 1, year: 1 }, { unique: true });

export default mongoose.model("InvoiceCounter", invoiceCounterSchema);