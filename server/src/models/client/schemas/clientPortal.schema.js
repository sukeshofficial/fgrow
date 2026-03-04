import mongoose from "mongoose";

const { Schema } = mongoose;

const clientPortalSchema = new Schema({
    portal: {
        type: Schema.Types.ObjectId,
        ref: "Portal",
        required: true
    },

    username: {
        type: String,
        trim: true,
        required: true
    },

    password: {
        type: String,
        trim: true,
        required: true
    },

    notes: String

}, { timestamps: true });

export default clientPortalSchema;