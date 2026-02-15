// controllers/auth.controller.js
// ------------------------------
// Module purpose:
// - Provide registration, OTP verification, login with lockout escalation,
//   resend OTP, logout and "get me" endpoints.
// - Lockout strategy: short lock on threshold (1 minute), escalated long lock (2 days).
//
// Function-style documentation approach:
// - Each exported function has a short description of purpose, inputs, outputs,
//   side effects (email sent, tokens set, DB writes), and example usage.

import crypto from "crypto";
import { User } from "../config/userModel.js";
import sendEmail from "../utils/sendEmail.js";
import { generateToken } from "../utils/jwt.js";
import { createNumericOtp, generateUsername } from "../utils/helper.js";
import validator from "validator";

/**
 * Configurable constants:
 * - THRESHOLD_SHORT: number of failed attempts before short lock.
 * - SHORT_LOCK_MS: duration of short lock.
 * - LONG_LOCK_MS: duration of escalated lock.
 *
 * Tweak these values from .env or a config file as product matures.
 */
const THRESHOLD_SHORT = 3;
const SHORT_LOCK_MS = 1 * 60 * 1000;
const LONG_LOCK_MS = 2 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

// Helper: send token as cookie + response minimal payload
const sendAuthSuccess = (res, user, payload = {}) => {
  const token = generateToken({ userId: user._id });
  res.cookie("auth_token", token, COOKIE_OPTIONS);
  // strip sensitive fields (User model has toJSON), but be explicit
  const safe = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
  return res
    .status(200)
    .json({ message: "Logged-in successfully", user: safe, ...payload });
};

/**
 * registerUser
 *  - Purpose: create account, persist hashed password, and send verification OTP.
 *  - Inputs (req.body): { name, email, password }
 *  - Side effects: saves User, sends OTP email (raw OTP), stores hashed reset token for verification.
 *  - Outputs: 201 + user safe payload
 *  - Example: POST /api/v0/auth/register { name, email, password }
 */

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "name, email and password are required" });
    if (!validator.isEmail(email))
      return res.status(400).json({ message: "invalid email" });

    const username = await generateUsername(email);
    const existing = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();
    if (existing)
      return res.status(409).json({ message: "account already exists" });

    const newUser = new User({
      name: name,
      username,
      email,
      profile_avatar: req.file ? req.file.path : "",
    });
    newUser.password = password;

    const rawOtp = createNumericOtp();
    const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");
    newUser.reset_token = hashedOtp;
    newUser.reset_token_expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    await newUser.save();

    await sendEmail({
      to: email,
      subject: "Your verification code",
      html: `<p>Your verification code is: <strong>${rawOtp}</strong>. It expires in 5 minutes.</p>`,
    });

    const safeUser = newUser.toJSON();
    return res
      .status(201)
      .json({ message: "User registered successfully", user: safeUser });
  } catch (err) {
    console.error("Register error:", err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(409).json({ message: `${field} already in use` });
    }
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * verifyOtp
 * - Purpose: consume OTP sent during signup; authenticate user by issuing cookie-JWT.
 * - Inputs: { email, otp }
 * - Side effects: clears reset token on success, issues auth cookie.
 * - Outputs: 200 + user safe payload
 * - Example: POST /api/v0/auth/verify-signup-otp { email, otp }
 */

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "email and otp required" });

    const hashed = crypto.createHash("sha256").update(otp).digest("hex");
    const now = Date.now();

    const user = await User.findOne({
      email,
      reset_token: hashed,
      reset_token_expiry: { $gt: now },
    }).select("+password_hash");
    if (!user)
      return res.status(400).json({ message: "invalid or expired otp" });

    user.reset_token = undefined;
    user.reset_token_expiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json({ message: "Email verified and authenticated successfully" });
  } catch (err) {
    console.error("Verify-Otp error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * resendSignupOtp
 * - Purpose: regenerate and send OTP for users that already created account but didn't verify.
 * - Inputs: { email }
 * - Side effects: updates reset_token & expiry in DB, sends email.
 * - Outputs: 200 on success
 * - Example: POST /api/v0/auth/resend-signup-otp { email }
 */

export const resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !validator.isEmail(email))
      return res.status(400).json({ message: "valid email required" });

    const user = await User.findOne({ email }).lean();
    if (!user)
      return res
        .status(404)
        .json({ message: "no account found for this email" });

    const otp = createNumericOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiry = Date.now() + 5 * 60 * 1000;

    await User.updateOne(
      { email },
      { $set: { reset_token: hashedOtp, reset_token_expiry: expiry } },
    );

    await sendEmail({
      to: email,
      subject: "Your verification code",
      html: `<p>Your verification code is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    });

    return res.status(200).json({ message: "Verification code resent" });
  } catch (err) {
    console.error("Resend Signup-Otp error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * loginUser
 * - Purpose: primary login endpoint with lockout/backoff behavior.
 * - Inputs: { email, password }
 * - Behavior summary:
 *   1. If the account is currently locked (locked_until in future) return 423.
 *   2. If password invalid, increment failed_login_attempts; on threshold apply:
 *      - first escalation: short lock (1 minute) and set lockout_level = 1
 *      - second escalation after a future failure: long lock (2 days), lockout_level = 2 and send notification email
 *   3. On successful login: reset counters, set last_login, issue auth cookie.
 * - Side effects: updates user doc, may send email on long lock.
 * - Outputs: 200 + user on success, appropriate error codes otherwise.
 * - Example success: POST /api/v0/auth/login { email, password } -> sets auth cookie
 */

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || !validator.isEmail(email)) {
      return res.status(400).json({ message: "email and password required" });
    }

    const user = await User.findOne({ email }).select(
      "+password_hash +failed_login_attempts +locked_until +lockout_level",
    );
    if (!user) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    // Account locked check
    if (user.locked_until && user.locked_until.getTime() > Date.now()) {
      const remainingMs = user.locked_until.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return res
        .status(423)
        .json({
          message: `Account locked. Try again in ${remainingMinutes} minute(s)`,
        });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;

      if (user.failed_login_attempts >= THRESHOLD_SHORT) {
        if (!user.lockout_level || user.lockout_level === 0) {
          user.lockout_level = 1;
          user.locked_until = new Date(Date.now() + SHORT_LOCK_MS);
          user.failed_login_attempts = 0;
        } else if (user.lockout_level === 1) {
          user.lockout_level = 2;
          user.locked_until = new Date(Date.now() + LONG_LOCK_MS);
          user.failed_login_attempts = 0;

          // Generate a reset token (raw) and persist hashed version to DB for recovery
          const rawReset = user.createResetToken(); // model method: sets reset_token & expiry
          await user.save({ validateBeforeSave: false });

          // Build reset link using raw token (safe to include in email)
          const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawReset}&email=${encodeURIComponent(user.email)}`;

          // Notify user on long lock (recovery path)
          try {
            await sendEmail({
              to: user.email,
              subject: "Account temporarily locked - action required",
              html: `<p>Your account has been locked for security reasons. To unlock, reset your password using the link below (valid for 1 hour):</p>
                     <p><a href="${resetLink}">${resetLink}</a></p>
                     <p>If you did not attempt sign-in, please contact support.</p>`,
            });
          } catch (e) {
            console.error("Failed to send lock notification email", e);
          }
        } else {
          // If lockout_level >=2, extend/keep long lock (optional)
          user.locked_until = new Date(Date.now() + LONG_LOCK_MS);
          user.failed_login_attempts = 0;
        }
      }

      await user.save({ validateBeforeSave: false });
      return res.status(401).json({ message: "invalid credentials" });
    }

    user.failed_login_attempts = 0;
    user.locked_until = undefined;
    user.lockout_level = 0;
    user.last_login = new Date();
    await user.save({ validateBeforeSave: false });

    return sendAuthSuccess(res, user);
  } catch (err) {
    console.error("Login User error", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// POST /api/v0/auth/reset-password
// Body: { email, token, newPassword }
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
      return res
        .status(400)
        .json({ message: "email, token and new password required" });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email,
      reset_token: hashed,
      reset_token_expiry: { $gt: Date.now() },
    }).select("+password_hash +locked_until +lockout_level");
    if (!user)
      return res.status(400).json({ message: "invalid or expired token" });

    // set new password (virtual)
    user.password = newPassword;

    user.reset_token = undefined;
    user.reset_token_expiry = undefined;
    user.locked_until = undefined;
    user.failed_login_attempts = 0;
    user.lockout_level = 0;
    user.last_login = new Date();

    await user.save();

    return res
      .status(200)
      .json({ message: "password reset successful — please login" });
  } catch (err) {
    console.error("Reset Password error", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * logoutUser
 * - Purpose: clear auth cookie (logout).
 * - Example: POST /api/auth/logout
 */

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("auth_token", COOKIE_OPTIONS);
    return res.status(200).json({ message: "logged out" });
  } catch (err) {
    console.error("Logout User error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * getMe
 * - Purpose: fetch current user's public profile (safe fields).
 * - Requires: auth middleware has attached req.user
 * - Example: GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const userId = req.user && req.user.id;
    if (!userId)
      return res.status(401).json({ message: "missing user in request" });

    const user = await User.findById(userId).select(
      "-password_hash -reset_token -reset_token_expiry -locked_until",
    );
    if (!user) return res.status(404).json({ message: "user not found" });
    return res.status(200).json({ message: "Your Details", user });
  } catch (err) {
    console.error("Get Me error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const userPreview = async (req, res) => {
  try {
    const { email } = req.query; // query param

    if (!email) {
      return res.status(400).json({ message: "missing email query param" });
    }

    const user = await User.findOne({ email }).select(
      "name profile_avatar username email",
    );

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const preview = {
      username: user.name || user.username,
      avatar: user.profile_avatar || "",
    };

    return res.status(200).json({
      message: "profile preview fetched",
      preview,
    });
  } catch (err) {
    console.error("User Preview error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};
