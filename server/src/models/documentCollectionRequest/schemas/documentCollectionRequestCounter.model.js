import mongoose from "mongoose";

const { Schema } = mongoose;

const documentCollectionRequestCounterSchema = new Schema(
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

documentCollectionRequestCounterSchema.index(
  { tenant_id: 1, year: 1 },
  { unique: true },
);

export default mongoose.model(
  "DocumentCollectionRequestCounter",
  documentCollectionRequestCounterSchema,
);
