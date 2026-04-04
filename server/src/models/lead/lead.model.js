import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"],
        },
        companyName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        status: {
            type: String,
            enum: ["new", "contacted", "converted", "rejected"],
            default: "new",
        },
    },
    {
        timestamps: true,
    }
);

export const Lead = mongoose.model("Lead", leadSchema);
