import mongoose from "mongoose";

const { Schema } = mongoose;

const customFieldSchema = new Schema({
    key: String,
    value: Schema.Types.Mixed,
}, { _id: false });

export default customFieldSchema;