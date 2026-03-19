import mongoose from "mongoose";

const { Schema } = mongoose;

const serviceClientSchema = new Schema({

    tenant_id: {
        type: Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },

    service: {
        type: Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },

    client: {
        type: Schema.Types.ObjectId,
        ref: "Client",
        required: true
    },

    custom_price: Number,
    is_recurring: Boolean,
    start_date: Date,
    end_date: Date,
    custom_users: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }]

}, { timestamps: true });

serviceClientSchema.index({ service: 1, client: 1 }, { unique: true });

export default mongoose.model("ServiceClient", serviceClientSchema);