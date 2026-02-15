// controllers/auth.controller.js
// ------------------------------
// Module purpose:
// - Provide registration, OTP verification, login with lockout escalation,
//   resend OTP, logout and "get me" endpoints.
// - Lockout strategy: short lock on threshold (1 minute),
//   escalated long lock (2 days).
//
// Function-style documentation approach:
// - Each exported function documents purpose, inputs, outputs,
//   side effects, and example usage.

import crypto from "crypto";
import validator from "validator";

import { User } from "../config/userModel.js";
import sendEmail from "../utils/sendEmail.js";
import { generateToken } from "../utils/jwt.js";
import { createNumericOtp, generateUsername } from "../utils/helper.js";
import { uploadToCloud } from "../utils/cloudinary.js";
/**
 * Configurable constants
 */
const THRESHOLD_SHORT = 3;
const SHORT_LOCK_MS = 1 * 60 * 1000; // 1 minute
const LONG_LOCK_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

/**
 * Helper: issue JWT cookie and return safe user payload
 */
const sendAuthSuccess = (res, user, payload = {}) => {
  const token = generateToken({ userId: user._id });

  res.cookie("auth_token", token, COOKIE_OPTIONS);

  const safeUser =
    typeof user.toJSON === "function" ? user.toJSON() : { ...user };

  return res.status(200).json({
    message: "Logged-in successfully",
    user: safeUser,
    ...payload,
  });
};

/**
 * registerUser
 * - Purpose: create account and send signup OTP
 * - Inputs: { name, email, password }
 * - Outputs: 201 + safe user
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

    // Upload to Cloudinary
    let avatarData = {
      public_id: "",
      secure_url: "",
    };

    if (req.file) {
      const upload = await uploadToCloud(req.file.path);

      if (!upload.success) {
        return res.status(500).json({
          message: "Image upload failed",
          error: upload.error,
        });
      }

      avatarData = {
        public_id: upload.public_id,
        secure_url: upload.secure_url,
      };
    }

    const newUser = new User({
      name,
      username,
      email,
      profile_avatar: avatarData,
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
 * - Purpose: verify signup OTP
 * - Inputs: { email, otp }
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "email and otp required" });
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
      reset_token: hashedOtp,
      reset_token_expiry: { $gt: Date.now() },
    }).select("+password_hash");

    if (!user) {
      return res.status(400).json({ message: "invalid or expired otp" });
    }

    user.reset_token = undefined;
    user.reset_token_expiry = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Email verified and authenticated successfully",
    });
  } catch (err) {
    console.error("Verify-Otp error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * resendSignupOtp
 * - Purpose: resend OTP for unverified accounts
 */
export const resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "valid email required" });
    }

    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res
        .status(404)
        .json({ message: "no account found for this email" });
    }

    const otp = createNumericOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await User.updateOne(
      { email },
      {
        $set: {
          reset_token: hashedOtp,
          reset_token_expiry: Date.now() + 5 * 60 * 1000,
        },
      },
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
 * - Purpose: login with lockout escalation
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

    if (user.locked_until && user.locked_until.getTime() > Date.now()) {
      const remainingMinutes = Math.ceil(
        (user.locked_until.getTime() - Date.now()) / 60000,
      );

      return res.status(423).json({
        message: `Account locked. Try again in ${remainingMinutes} minute(s)`,
      });
    }

    const validPassword = await user.comparePassword(password);

    if (!validPassword) {
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

          const rawResetToken = user.createResetToken();
          await user.save({ validateBeforeSave: false });

          const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawResetToken}&email=${encodeURIComponent(
            user.email,
          )}`;

          try {
            await sendEmail({
              to: user.email,
              subject: "Account temporarily locked - action required",
              html: `<p>Your account has been locked for security reasons.</p>
                     <p><a href="${resetLink}">${resetLink}</a></p>`,
            });
          } catch (e) {
            console.error("Failed to send lock email", e);
          }
        } else {
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
    console.error("Login User error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * resetPassword
 * - Inputs: { email, token, newPassword }
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res
        .status(400)
        .json({ message: "email, token and new password required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      reset_token: hashedToken,
      reset_token_expiry: { $gt: Date.now() },
    }).select("+password_hash +locked_until +lockout_level");

    if (!user) {
      return res.status(400).json({ message: "invalid or expired token" });
    }

    user.password = newPassword;
    user.reset_token = undefined;
    user.reset_token_expiry = undefined;
    user.locked_until = undefined;
    user.failed_login_attempts = 0;
    user.lockout_level = 0;
    user.last_login = new Date();

    await user.save();

    return res.status(200).json({
      message: "password reset successful — please login",
    });
  } catch (err) {
    console.error("Reset Password error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * logoutUser
 */
export const logoutUser = async (_req, res) => {
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
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user && req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "missing user in request" });
    }

    const user = await User.findById(userId).select(
      "-password_hash -reset_token -reset_token_expiry -locked_until",
    );

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    return res.status(200).json({ message: "Your Details", user });
  } catch (err) {
    console.error("Get Me error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * userPreview
 */
export const userPreview = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "missing email query param" });
    }

    const user = await User.findOne({ email }).select(
      "name profile_avatar username email",
    );

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    return res.status(200).json({
      message: "profile preview fetched",
      preview: {
        username: user.name || user.username,
        avatar: user.profile_avatar.secure_url,
      },
    });
  } catch (err) {
    console.error("User Preview error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};
