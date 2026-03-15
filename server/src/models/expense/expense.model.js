import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * payment subdocument - one or more payments that make up the expense
 */
const paymentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    payment_mode: { type: String, trim: true }, // e.g. 'Bank Transfer', 'Cash', 'Cheque'
    reference: { type: String, trim: true }, // txn id / cheque no
    note: { type: String, trim: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

/**
 * file metadata - store S3/drive references, or local path, mime, size
 */
const fileSchema = new Schema(
  {
    key: { type: String, required: true },
    url: { type: String, required: true },
    name: { type: String, trim: true },
    size: { type: Number },
    mime: { type: String, trim: true },
    uploaded_at: { type: Date, default: Date.now },
    uploaded_by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

/**
 * applied invoice - link to invoice if this expense was billed against invoice
 */
const appliedInvoiceSchema = new Schema(
  {
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    invoice_no: { type: String, trim: true },
    invoice_date: { type: Date },
    invoice_amount: { type: Number, default: 0 },
    amount_applied: { type: Number, required: true }, // amount from this expense applied to invoice
  },
  { _id: false },
);

/**
 * main expense schema
 */
const expenseSchema = new Schema(
  {
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    // Optional: currency-aware numbering. You can mirror receipt/quotation pattern.
    expense_no: { type: String, required: true, trim: true, index: true },

    category: {
      type: Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      default: null,
    },

    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },

    date: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true, default: 0 }, // total expense
    tds_amount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    round_off: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 }, // computed: amount - tds - discount + round_off

    payment_mode: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMode",
      default: null,
    },
    payments: [paymentSchema],

    // billing status: whether expense is billed/reimbursed/attached to invoice
    billing_status: {
      type: String,
      enum: ["unbilled", "billed", "partially_billed"],
      default: "unbilled",
      index: true,
    },

    // optional: link to invoice if it generated an invoice or is billed to client
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },

    applied_invoices: [appliedInvoiceSchema], // supports partial billing across invoices

    notes: { type: String, trim: true },

    files: [fileSchema], // attachments (receipts, bills, etc.)

    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },

    archived: { type: Boolean, default: false },
    archived_at: { type: Date, default: null },
  },
  { timestamps: true },
);

// indexes: ensure per-tenant unique numbers
expenseSchema.index({ tenant_id: 1, expense_no: 1 }, { unique: true });
expenseSchema.index({ tenant_id: 1, client: 1 });
expenseSchema.index({ tenant_id: 1, date: -1 });

export default mongoose.model("Expense", expenseSchema);
