import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    // Basic Company Info
    name: { type: String, required: true, trim: true },
    companyEmail: { type: String, trim: true, lowercase: true },
    companyPhone: { type: String, trim: true },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    domain: { type: String, unique: true, sparse: true },
    logoUrl: String,

    timezone: { type: String, default: "Asia/Kolkata" },
    currency: { type: String, default: "INR" },

    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    isGstVerified: {
      type: Boolean,
      default: false,
    },
    isAdminGstVerified: {
      type: Boolean,
      default: false,
    },
    adminGstVerifiedAt: {
      type: Date,
      default: null,
    },

    registrationNumber: {
      type: String,
      trim: true,
    },

    officialAddress: {
      type: String,
      trim: true,
    },

    gstCertificate: {
      type: String,
      trim: true,
    },

    companyAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    rejection_reason: {
      type: String,
      default: null,
    },

    // Trial & Plan
    trialUsed: {
      type: Boolean,
      default: false,
    },

    trialEndDate: {
      type: Date,
    },

    plan: {
      type: String,
      enum: ["free_trial", "basic", "pro", "enterprise"],
      default: "free_trial",
    },

    // Ownership
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Appeal for Rejected Tenants
    appealCount: {
      type: Number,
      default: 0,
    },

    lastAppealedAt: {
      type: Date,
      default: null,
    },

    // Access Restriction (Super Admin controlled)
    accessRestricted: {
      type: Boolean,
      default: false,
    },

    // Grace period (days from verifiedAt) before auto-restriction kicks in
    accessGracePeriodDays: {
      type: Number,
      default: 30,
    },

    // Audit timestamp – when restriction was last toggled by super admin
    accessRestrictedAt: {
      type: Date,
      default: null,
    },
    // Reason provided by super admin for manual restriction
    accessRestrictionReason: {
      type: String,
      trim: true,
      default: null,
    },

    // Billing & Payments
    userLimit: {
      type: Number,
      default: 0, // 0 means no explicit limit, or use it to track paid seats
    },
    lastPaymentAmount: {
      type: Number,
      default: 0,
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["active", "overdue", "pending_verification"],
      default: "active",
    },

    emailChangeLog: [
      {
        type: Date,
        default: Date.now,
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Tenant", tenantSchema);
