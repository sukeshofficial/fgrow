import mongoose from "mongoose";

const { Schema } = mongoose;

const addressSchema = new Schema({
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: "India" },
}, { _id: false });

export default addressSchema;