// models/service/schemas/serviceFile.schema.js
import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Supporting file schema used by tasks (placeholder / suggested)
 * If you already have a serviceFile schema elsewhere, replace this file with that schema.
 *
 * Common fields included: filename, url/path, size, mime_type, uploaded_by, uploaded_at, notes, metadata
 */
const serviceFileSchema = new Schema(
  {
    filename: { type: String, required: true, trim: true },
    original_name: { type: String, trim: true },
    url: { type: String, trim: true }, // or path
    size: { type: Number, default: 0 }, // bytes
    mime_type: { type: String, trim: true },
    uploaded_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    uploaded_at: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed }, // any additional provider-specific metadata
  },
  { _id: false },
);

export default serviceFileSchema;
