// controllers/auth.controller.js
/**
 * Authentication controller
 *
 * Purpose:
 * - Handle registration, OTP verification, login with lockout escalation,
 *   OTP resend, logout, password reset, and profile retrieval.
 *
 * Lockout strategy:
 * - Short lock after threshold (1 minute)
 * - Escalated long lock (2 days) with forced password reset
 */

import crypto from "crypto";
import validator from "validator";
import fs from "fs";

import sendEmail from "../utils/sendEmail.js";
import Tenant from "../models/tenant/tenant.model.js";

import { User } from "../models/auth/user.model.js";
import { generateToken } from "../utils/jwt.js";
import { createNumericOtp, generateUsername } from "../utils/helper.js";
import { uploadToCloud } from "../utils/cloudinary.js";
import { UserInvitation } from "../models/auth/userInvitation.model.js";

// Lockout configuration
const THRESHOLD_SHORT = 3;
const SHORT_LOCK_MS = 1 * 60 * 1000; // 1 minute
const LONG_LOCK_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

// Auth cookie configuration
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
 * - Create user account and send signup OTP
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email and password are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "invalid email" });
    }

    const username = await generateUsername(email);

    const existing = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existing) {
      return res.status(409).json({ message: "account already exists" });
    }

    let avatarData = {
      public_id: "",
      secure_url: "",
    };

    // Optional avatar upload
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

    // OTP generation
    const rawOtp = createNumericOtp();
    const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");

    newUser.reset_token = hashedOtp;
    newUser.reset_token_expiry = Date.now() + 5 * 60 * 1000;

    await newUser.save();

    if (req.file) {
      fs.unlinkSync(req.file.path);
      console.log(`File - ${req.file.path} deleted`);
    }

    await sendEmail({
      to: email,
      subject: "Your verification code",
      html: `<p>Your verification code is: <strong>${rawOtp}</strong>. It expires in 5 minutes.</p>`,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: newUser.toJSON(),
    });
  } catch (err) {
    console.error("Register error:", err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(409).json({ message: `${field} already in use` });
    }

    return res.status(500).json({
      message: "internal server error",
    });
  }
};

/**
 * verifyOtp
 * - Verify signup OTP
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
    user.emailVerified = true;
    user.reset_token = undefined;
    user.reset_token_expiry = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Email verified and authenticated successfully",
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Verify-Otp error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

/**
 * resendSignupOtp
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

    if (user.emailVerified) {
      return res.status(400).json({ message: "email already verified" });
    }

    const otp = createNumericOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.reset_token = hashedOtp;
    user.reset_token_expiry = Date.now() + 5 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: email,
      subject: "Your new verification code (resend)",
      html: `<p>Your verification code is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    });

    return res.status(200).json({ message: "Verification code resent" });
  } catch (err) {
    console.error("Resend Signup-Otp error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

/**
 * loginUser
 * - Login with lockout escalation
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || !validator.isEmail(email)) {
      return res.status(400).json({ message: "email and password required" });
    }

    const user = await User.findOne({
      email,
      reset_token: null,
      reset_token_expiry: null,
    }).select(
      "+password_hash +failed_login_attempts +locked_until +lockout_level",
    );

    if (!user) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    // Active lock check
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
        } else {
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
              subject: "Account temporarily locked",
              html: `<p>Your account has been locked.</p><p><a href="${resetLink}">${resetLink}</a></p>`,
            });
          } catch (e) {
            console.error("Failed to send lock email", e);
          }
        }
      }

      await user.save({ validateBeforeSave: false });
      return res.status(401).json({ message: "invalid credentials" });
    }

    // Successful login reset
    user.failed_login_attempts = 0;
    user.locked_until = undefined;
    user.lockout_level = 0;
    user.last_login = new Date();

    const superAdminEmails = process.env.SUPER_ADMIN_EMAILS.split(",");

    if (superAdminEmails.includes(user.email)) {
      user.platform_role = "super_admin";
    }

    await user.save({ validateBeforeSave: false });

    return sendAuthSuccess(res, user);
  } catch (err) {
    console.error("Login User error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

/**
 * resetPassword
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        message: "email, token and new password required",
      });
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
    return res.status(500).json({
      message: "internal server error",
    });
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
    return res.status(500).json({
      message: "internal server error",
    });
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

    if (!user.tenant_id) {
      const invitation = await UserInvitation.findOne({
        email: user.email,
        accepted_at: null,
        expires_at: { $gt: new Date() },
      }).populate("tenant");

      if (invitation) {
        return res.status(200).json({
          message: "User Invited",
          state: "INVITED",
          user,
          invitation: {
            tenantName: invitation.tenant?.name || null,
            tenant_role: invitation.tenant_role,
            token: invitation.invite_token,
          },
        });
      }

      return res.status(200).json({
        message: "Tenant setup required",
        state: "NO_TENANT",
        user,
      });
    }

    const tenant = await Tenant.findById(user.tenant_id).select(
      "name verificationStatus verifiedBy verifiedAt rejection_reason isActive createdAt plan"
    ).populate("verifiedBy", "name email");

    if (!tenant) {
      // tenant reference broken or deleted
      return res.status(400).json({
        message: "Tenant not found (referenced tenant missing)",
        state: "TENANT_MISSING",
        user,
      });
    }

    // Tenant-level gating
    if (!tenant.isActive) {
      return res.status(200).json({
        message: "Tenant is inactive",
        state: "TENANT_INACTIVE",
        user,
        tenant: {
          id: tenant._id,
          name: tenant.name,
          isActive: tenant.isActive,
        },
      });
    }

    // Use your existing verificationStatus field as the approval state
    switch (tenant.verificationStatus) {
      case "verified":
        return res.status(200).json({
          message: "User Active",
          state: "ACTIVE",
          user,
          tenant: {
            id: tenant._id,
            name: tenant.name,
            plan: tenant.plan,
          },
        });

      case "pending":
      default:
        return res.status(200).json({
          message: "Tenant pending verification",
          state: "PENDING_VERIFICATION",
          user,
          tenant: {
            id: tenant._id,
            name: tenant.name,
            verificationStatus: tenant.verificationStatus,
            createdAt: tenant.createdAt,
          },
        });

      case "rejected":
        return res.status(200).json({
          message: "Tenant rejected",
          state: "REJECTED_VERIFICATION",
          user,
          tenant: {
            id: tenant._id,
            name: tenant.name,
            verificationStatus: tenant.verificationStatus,
            rejection_reason: tenant.rejection_reason,
            verifiedBy: tenant.verifiedBy,
            verifiedAt: tenant.verifiedAt,
          },
        });
    }
  } catch (err) {
    console.error("Get Me error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
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
    return res.status(500).json({
      message: "internal server error",
    });
  }
};
