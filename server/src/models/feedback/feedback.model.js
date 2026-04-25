import mongoose from "mongoose";

/**
 * Feedback model
 *
 * Purpose:
 * - Capture structured product feedback from authenticated users.
 * - Linked to the user's tenant for tenant-level analytics.
 * - Accessible only to Super Admins.
 */

const feedbackSchema = new mongoose.Schema(
  {
    // Who submitted the feedback
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Which tenant the user belongs to
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },

    // Feedback category
    category: {
      type: String,
      enum: ["UI/UX", "Performance", "Features", "Support", "Other"],
      required: true,
      default: "Other",
    },

    // Star rating 1-5
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Freeform comment
    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // Super Admin review status
    status: {
      type: String,
      enum: ["new", "reviewed", "archived"],
      default: "new",
      index: true,
    },

    // Optional: extra metadata (browser, platform info)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);
