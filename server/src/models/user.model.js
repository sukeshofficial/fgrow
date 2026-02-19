// config/user.model.js
/**
 * User model
 *
 * Purpose:
 * - Store user credentials and security-related metadata.
 * - Provide helpers for password hashing and reset tokens.
 * - Expose only safe fields when serializing user objects.
 *
 * Notes:
 * - Username: lowercase, 3–30 chars, [a-z0-9._-]
 * - Email validated via validator.isEmail
 * - Sensitive fields are select:false and stripped in toJSON
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import validator from "validator";

const SALT_ROUNDS = 12;

// User schema definition
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    // Unique username used for identification
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9._-]+$/, "Invalid username"],
    },

    // User email address
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: "Please enter a valid email address",
      },
    },

    // Authentication credentials
    password_hash: {
      type: String,
      required: true,
      select: false,
    },

    // Profile avatar (cloud storage reference)
    profile_avatar: {
      public_id: { type: String, default: "" },
      secure_url: { type: String, default: "" },
    },

    // Password reset fields
    reset_token: { type: String, select: false },
    reset_token_expiry: { type: Date, select: false },

    // Security metadata
    last_login: { type: Date, default: null },
    failed_login_attempts: {
      type: Number,
      default: 0,
      select: false,
    },
    locked_until: { type: Date, select: false },
    lockout_level: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Virtual password field for plain-text assignment
userSchema.virtual("password").set(function (password) {
  this._password = password;
});

// Hash password before validation if provided
userSchema.pre("validate", async function () {
  if (!this._password) return;

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password_hash = await bcrypt.hash(this._password, salt);
});

// Compare plain password with stored hash
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password_hash);
};

// Generate password reset token and expiry
userSchema.methods.createResetToken = function (
  expiryMs = 60 * 60 * 1000,
) {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.reset_token = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.reset_token_expiry = Date.now() + expiryMs;

  return rawToken;
};

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password_hash;
  delete obj.reset_token;
  delete obj.reset_token_expiry;
  delete obj.locked_until;

  return obj;
};

export const User = mongoose.model("User", userSchema);
