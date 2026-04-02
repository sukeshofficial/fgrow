// models/receipt.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const appliedInvoiceSchema = new Schema(
    {
        invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
        invoice_no: { type: String, trim: true },
        invoice_date: { type: Date },
        invoice_amount: { type: Number, default: 0 },
        invoice_balance: { type: Number, default: 0 }, // remaining balance on invoice after this application
        amount_applied: { type: Number, required: true }, // amount of this receipt applied
    },
    { _id: true }
);

const paymentSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        amount: { type: Number, required: true },
        date: { type: Date, required: true },
        payment_mode: { type: String, trim: true }, // Bank Transfer, Cheque, Cash, etc.
        reference: { type: String, trim: true }, // txn id / cheque no
        note: { type: String, trim: true },
        created_by: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { _id: false }
);

const receiptSchema = new Schema(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },

        receipt_no: { type: String, required: true, trim: true },
        billing_entity: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },

        client: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },

        date: { type: Date, required: true, default: Date.now },
        received_amount: { type: Number, required: true, default: 0 }, // total amount received
        tds_amount: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        round_off: { type: Number, default: 0 },
        total_amount: { type: Number, default: 0 }, // computed: received - tds - discount + round_off

        // payments array (one or more forms of payment making up the received_amount)
        payments: [paymentSchema],

        // invoices that this receipt settles (applied allocations)
        applied_invoices: [appliedInvoiceSchema],

        // bookkeeping fields
        status: {
            type: String,
            enum: ["draft", "settled", "partially_settled", "cancelled"],
            default: "draft",
            index: true,
        },

        // free text
        remark: { type: String, trim: true },

        created_by: { type: Schema.Types.ObjectId, ref: "User" },
        updated_by: { type: Schema.Types.ObjectId, ref: "User" },

        archived: { type: Boolean, default: false },
        archived_at: { type: Date, default: null },
    },
    { timestamps: true }
);

// indexes
receiptSchema.index({ tenant_id: 1, receipt_no: 1 }, { unique: true });
receiptSchema.index({ tenant_id: 1, client: 1 });

export default mongoose.model("Receipt", receiptSchema);