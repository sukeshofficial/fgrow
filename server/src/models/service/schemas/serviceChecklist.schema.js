import mongoose from "mongoose";

const { Schema } = mongoose;

const serviceChecklistSchema = new Schema({
    step: {
        type: String,
        required: true,
        trim: true,
    },

    order: {
        type: Number,
        default: 0,
    },
});

export default serviceChecklistSchema;