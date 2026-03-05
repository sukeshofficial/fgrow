import mongoose from "mongoose";

const { Schema } = mongoose;

const serviceSubtaskSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
    },

    due_in_days: {
        type: Number,
        default: null,
    },

    target_days: {
        type: Number,
        default: null,
    },

    assign_to_role: {
        type: String,
    },

    order: {
        type: Number,
        default: 0,
    },
});

export default serviceSubtaskSchema;