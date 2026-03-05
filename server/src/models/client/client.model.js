import mongoose from "mongoose";

import contactSchema from "./schemas/contact.schema.js";
import addressSchema from "./schemas/address.schema.js";
import recurringItemSchema from "./schemas/recurringItem.schema.js";
import packageSchema from "./schemas/package.schema.js";
import customFieldSchema from "./schemas/customField.schema.js";
import clientPortalSchema from "./schemas/clientPortal.schema.js";

const { Schema } = mongoose;

const clientSchema = new Schema(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },

        file_no: { type: String, trim: true, index: true },
        name: { type: String, required: true, trim: true, index: true },

        photo: {
            public_id: { type: String, default: "" },
            secure_url: { type: String, default: "" },
        },

        type: {
            type: String,
            enum: [
                "Individual",
                "Sole Proprietorship",
                "Partnership",
                "LLP",
                "HUF",
                "Private Limited",
                "Limited Company",
                "One-Person Company",
                "NGO",
                "Trust",
                "Government Entity",
                "Other",
            ],
            default: "Individual",
            index: true,
        },

        customType: {
            type: String,
            trim: true
        },

        group: { type: Schema.Types.ObjectId, ref: "ClientGroup", default: null },

        tags: [{
            type: Schema.Types.ObjectId,
            ref: "Tag",
            index: true
        }],

        pan: { type: String, required: true, trim: true, uppercase: true, index: true },
        gstin: { type: String, trim: true, uppercase: true, index: true },

        billing_profile: { type: Schema.Types.ObjectId, ref: "BillingEntity", default: null },

        opening_balance: {
            enabled: { type: Boolean, default: false },
            amount: { type: Number, default: 0 },
            type: { type: String, enum: ["debit", "credit"] },
            as_of: { type: Date },
            currency: { type: String, default: "INR" }
        },

        contacts: [contactSchema],

        portal_credentials: [clientPortalSchema],

        primary_contact_name: String,
        primary_contact_mobile: String,
        primary_contact_email: String,

        address: addressSchema,
        recurring_services: [recurringItemSchema],
        packages: [packageSchema],
        is_active: { type: Boolean, default: true },
        is_non_recurring: { type: Boolean, default: false },
        custom_fields: [customFieldSchema],
        created_by: { type: Schema.Types.ObjectId, ref: "User" },
        updated_by: { type: Schema.Types.ObjectId, ref: "User" },
        archived: { type: Boolean, default: false },
        archived_at: { type: Date, default: null },
    },
    { timestamps: true }
);

clientSchema.index({ tenant_id: 1, pan: 1 });
clientSchema.index({ tenant_id: 1, file_no: 1 });
clientSchema.index({ tenant_id: 1, name: "text", "contacts.name": "text" });

export default mongoose.model("Client", clientSchema);