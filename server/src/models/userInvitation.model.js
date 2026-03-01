import mongoose from "mongoose";
import crypto from "crypto";

const userInvitationSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["admin", "staff", "read_only"],
      default: "staff",
    },

    invited_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    invite_token: {
      type: String,
      unique: true,
      required: true,
    },

    expires_at: {
      type: Date,
      required: true,
    },

    accepted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userInvitationSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

export const UserInvitation = mongoose.model(
  "UserInvitation",
  userInvitationSchema,
);
