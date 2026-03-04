import mongoose from "mongoose";

const { Schema } = mongoose;

const contactSchema = new Schema({
    name: { type: String, trim: true },
    role: { type: String, trim: true },
    mobile: { type: String, trim: true },
    secondary_mobile: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    dob: { type: Date },
    is_primary: { type: Boolean, default: false },
}, { _id: false });

export default contactSchema;