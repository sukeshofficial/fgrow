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
import logger from "../utils/logger.js";

import { User } from "../models/auth/user.model.js";
import { generateToken } from "../utils/jwt.js";
import { createNumericOtp, generateUsername } from "../utils/helper.js";
import { uploadBufferToCloud } from "../utils/cloudinary.js";
import { UserInvitation } from "../models/auth/userInvitation.model.js";

// Lockout configuration
const THRESHOLD_SHORT = 3;
const SHORT_LOCK_MS = 1 * 60 * 1000; // 1 minute
const LONG_LOCK_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

// Auth cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

/**
 * Helper: issue JWT cookie and return safe user payload
 */
const sendAuthSuccess = (res, user, payload = {}) => {
  const token = generateToken({
    userId: user._id,
    token_version: user.token_version ?? 0
  });

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
      // If the account exists but email isn't verified, resend the OTP
      if (!existing.emailVerified) {
        const rawOtp = createNumericOtp();
        const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");

        await User.findByIdAndUpdate(existing._id, {
          reset_token: hashedOtp,
          reset_token_expiry: Date.now() + 5 * 60 * 1000,
        });

        await sendEmail({
          to: existing.email,
          subject: "Complete your FGrow registration — Verification Code",
          text: `Hello ${existing.name}, your verification code is ${rawOtp}. It expires in 5 minutes.`,
          html: `<div style="font-family:'Poppins',sans-serif;max-width:500px;margin:40px auto;background:#fff;padding:40px;border-radius:20px;border:1px solid #e2e8f0;">
            <h2 style="color:#2563eb;text-align:center;">Complete your registration</h2>
            <p style="color:#475569;text-align:center;">You started signing up but didn't verify your email. Use the code below to finish.</p>
            <div style="font-size:32px;font-weight:800;color:#2563eb;letter-spacing:12px;text-align:center;padding:24px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:16px;">${rawOtp}</div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:12px;">Expires in <strong>5 minutes</strong></p>
          </div>`,
        });

        return res.status(409).json({
          message: "account already exists",
          pendingVerification: true,
          email: existing.email,
        });
      }

      return res.status(409).json({ message: "account already exists" });
    }

    let avatarData = {
      public_id: "",
      secure_url: "",
    };

    // Optional avatar upload
    if (req.file) {
      const upload = await uploadBufferToCloud(req.file.buffer, "users");

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

    let invitation = await UserInvitation.findOne({
      email,
      accepted_at: null,
    });

    let invitedBy;
    let tenant_id = null;
    let tenant_role = "none";

    // Reconnection logic: if no active invitation, check for past associations
    if (!invitation) {
      // 1. Check for previously accepted invitations (staff)
      invitation = await UserInvitation.findOne({ email }).sort({ createdAt: -1 });

      if (!invitation) {
        // 2. Check if this user owns a tenant (owner)
        const ownedTenant = await Tenant.findOne({ companyEmail: email });
        if (ownedTenant) {
          tenant_id = ownedTenant._id;
          tenant_role = "owner";
        }
      }
    }

    if (invitation) {
      // Check expiry only for active (unaccepted) invitations
      if (!invitation.accepted_at && invitation.expires_at < Date.now()) {
        return res.status(400).json({
          message: "Invitation expired",
        });
      }

      invitedBy = invitation.invited_by;
      tenant_id = invitation.tenant_id;
      tenant_role = invitation.tenant_role;

      if (!invitation.accepted_at) {
        invitation.accepted_at = new Date();
        await invitation.save();
      }
    }

    // Create user
    const user = new User({
      name,
      username,
      email,
      invited_by: invitedBy,
      tenant_id: tenant_id,
      tenant_role: tenant_role,
      profile_avatar: avatarData,
      status: "active",
      joined_at: new Date(),
    });

    user.password = password;

    // OTP generation
    const rawOtp = createNumericOtp();
    const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");

    user.reset_token = hashedOtp;
    user.reset_token_expiry = Date.now() + 5 * 60 * 1000;

    await user.save();
    // Send Registration Welcome & Verification Email
    logger.info(`Registration: Sending OTP to ${email}`);
    await sendEmail({
      to: email,
      subject: "Welcome to FGROW! 🚀 — Verify your account",
      text: `Hello ${name}, welcome to the family! Your verification code is ${rawOtp}.`,
      html: `
    <!DOCTYPE html>
    <html>
    <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Poppins', sans-serif !important; }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Poppins', sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; color: #1e293b; padding: 48px 40px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <div style="text-align: center; margin-bottom: 32px;">
                <img src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1775310579/tenants/a7tvcuo0moqztzeoevaz.png" alt="FGrow" style="width: 80px; height: 80px; border-radius: 16px; margin-bottom: 16px;">
                <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: -0.02em; font-weight: 700;">Welcome! 🥂</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Hello ${name?.split(" ")[0]}, we're thrilled to have you join FGROW.</p>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                <p style="font-size: 14px; line-height: 1.7; color: #334155; margin: 0; text-align: justify;">
                    We're excited to have you on board. FGrow is your ultimate self-hosted hub for managing clients, tasks, and invoices. 
                    To get started and secure your account, please use the verification code below to activate your profile.
                </p>
            </div>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 32px; margin-bottom: 32px; text-align: center;">
                <p style="font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; font-weight: 600;">Verification Code</p>
                <div style="font-size: 36px; font-weight: 800; color: #2563eb; letter-spacing: 12px;">
                    ${rawOtp}
                </div>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 12px;">Expires in <strong>5 minutes</strong></p>
            </div>

            <div style="text-align: center; margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                    Thank you for being part of our journey.<br>
                    <strong>The ForgeGrid Team</strong>
                </p>
            </div>
        </div>
    </body>
    </html>
    `,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: user.toJSON(),
    });
  } catch (err) {
    logger.error("Register error:", err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";

      return res.status(409).json({
        message: `${field} already in use`,
      });
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

    // Reconnection: If reregistering owner, link the tenant back to this new user ID
    if (user.tenant_role === "owner" && user.tenant_id) {
      await Tenant.findByIdAndUpdate(user.tenant_id, {
        ownerUserId: user._id,
      });
    }

    return sendAuthSuccess(res, user, {
      message: "Email verified and authenticated successfully",
    });
  } catch (err) {
    logger.error("Verify-Otp error:", err);
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

    const user = await User.findOne({ email });

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
      text: `Your new verification code is ${otp}. It expires in 5 minutes.`,
      html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #e0e0e0;">
      
      <!-- Circular Image -->
      <div style="text-align: center; margin-bottom: 20px;">
        <img 
          src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1775310579/tenants/a7tvcuo0moqztzeoevaz.png" 
          alt="Profile"
          style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #e0e0e0;
          "
        />
      </div>

      <h2 style="margin-top: 0; color: #2c3e50; text-align: center;">
        New Verification Code 🔄
      </h2>
      
      <p style="font-size: 14px; color: #555; text-align: center;">
        You requested a new verification code. Use the code below to continue.
      </p>

      <p style="font-size: 14px; color: #555; text-align: center;">
        This code will expire in <strong>5 minutes</strong>.
      </p>

      <div style="
        margin: 25px 0;
        padding: 15px;
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 4px;
        background-color: #f8f9fa;
        border: 1px dashed #ccc;
        border-radius: 6px;
      ">
        ${otp.toString().split('').join(' ')}
      </div>

      <p style="font-size: 13px; color: #888; text-align: center;">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <p style="font-size: 13px; color: #888; text-align: center;">
        — FGrow Team
      </p>

    </div>
  </div>
  `,
    });

    return res.status(200).json({ message: "Verification code resent" });
  } catch (err) {
    logger.error("Resend Signup-Otp error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

/**
 * forgotPasswordRequest
 * - Generate and send OTP for password reset
 */
export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "valid email required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if account exists or not
      return res.status(200).json({ message: "If an account exists, an OTP has been sent" });
    }

    const otp = createNumericOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.reset_token = hashedOtp;
    user.reset_token_expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    logger.info(`ForgotPassword: Sending OTP to ${email}`);
    await sendEmail({
      to: email,
      subject: "Password Reset OTP - FGrow 🛡️",
      text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
      html: `
    <div style="font-family: 'Poppins', sans-serif; background-color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        
        <div style="text-align: center; margin-bottom: 32px;">
          <img 
            src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1775310579/tenants/a7tvcuo0moqztzeoevaz.png" 
            alt="FGrow"
            style="width: 70px; height: 70px; border-radius: 18px; margin-bottom: 20px;"
          />
          <h2 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 700;">Reset Your Password</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Use the code below to complete your reset request.</p>
        </div>

        <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <div style="font-size: 32px; font-weight: 800; color: #2563eb; letter-spacing: 10px;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 12px; text-transform: uppercase; font-weight: 600;">Valid for 10 minutes</p>
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6; text-align: center; margin-bottom: 32px;">
          If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
        </p>

        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px;">
          <p style="font-size: 13px; color: #94a3b8; margin: 0;">
            Securing your growth,<br>
            <strong>The FGrow Security Team</strong>
          </p>
        </div>
      </div>
    </div>
      `,
    });

    return res.status(200).json({ message: "If an account exists, an OTP has been sent" });
  } catch (err) {
    logger.error("Forgot Password Request error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * verifyResetOtp
 * - Verify the OTP before allowing password reset
 */
export const verifyResetOtp = async (req, res) => {
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
    });

    if (!user) {
      return res.status(400).json({ message: "invalid or expired otp" });
    }

    return res.status(200).json({ message: "OTP verified. Proceed to reset password." });
  } catch (err) {
    logger.error("Verify Reset OTP error:", err);
    return res.status(500).json({ message: "internal server error" });
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

    // Find the user regardless of OTP token state
    const user = await User.findOne({ email }).select(
      "+password_hash +failed_login_attempts +locked_until +lockout_level",
    );

    if (!user) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    // If user registered but never verified email, give informative message
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        pendingVerification: true,
        email: user.email,
      });
    }

    // Reject login if a reset/OTP token is still active (non-verified state)
    if (user.reset_token && user.reset_token_expiry > Date.now()) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        pendingVerification: true,
        email: user.email,
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
              subject: "Your account has been temporarily locked",
              text: `Your account has been temporarily locked due to multiple failed attempts. Reset your password here: ${resetLink}`,
              html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="max-width: 520px; margin: auto; background: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #e0e0e0;">
        
        <!-- Circular Image -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img 
            src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1775310579/tenants/a7tvcuo0moqztzeoevaz.png" 
            alt="Profile"
            style="
              width: 80px;
              height: 80px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid #e0e0e0;
            "
          />
        </div>

        <h2 style="margin-top: 0; color: #c0392b; text-align: center;">
          Account Locked 🔒
        </h2>
        
        <p style="font-size: 14px; color: #555; text-align: center;">
          Your account has been temporarily locked due to multiple unsuccessful login attempts.
        </p>

        <p style="font-size: 14px; color: #555; text-align: center;">
          For your security, please reset your password to regain access.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" 
            style="
              display: inline-block;
              padding: 12px 20px;
              background-color: #e74c3c;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">
            Reset Password
          </a>
        </div>

        <p style="font-size: 13px; color: #888; text-align: center;">
          If you did not attempt to log in, we strongly recommend resetting your password immediately.
        </p>

        <p style="font-size: 13px; color: #aaa; word-break: break-all; text-align: center;">
          If the button doesn’t work, copy and paste this link into your browser:<br/>
          ${resetLink}
        </p>

        <p style="font-size: 13px; color: #888; text-align: center;">
          — FGrow Security Team
        </p>

      </div>
    </div>
  `,
            });
          } catch (e) {
            logger.error("Failed to send lock email", e);
          }
        }
      }

      await user.save({ validateBeforeSave: false });
      return res.status(401).json({ message: "invalid credentials" });
    }

    // Capture if this is the first login before updating stats
    const isFirstLogin = !user.last_login_at;

    // Successful login reset
    user.failed_login_attempts = 0;
    user.locked_until = undefined;
    user.lockout_level = 0;
    user.last_login_at = new Date();
    user.status = "active";

    const superAdminEmails = process.env.SUPER_ADMIN_EMAILS.split(",");

    if (superAdminEmails.includes(user.email)) {
      user.platform_role = "super_admin";
    }

    if (user.tenant_id && user.tenant_role === "none") {
      user.tenant_role = "staff";
    }

    await user.save({ validateBeforeSave: false });

    // Send Welcome Email only on 1st login (Asynchronously)
    if (isFirstLogin) {
      const loginTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "short",
      });

      logger.info(`Login: Sending 1st login welcome email to ${user.email}`);
      await sendEmail({
        to: user.email,
        subject: "Welcome back! - FGrow ✨",
        text: `Hello ${user.name}, welcome to your account! You have successfully logged in on ${loginTime}.`,
        html: `
    <!DOCTYPE html>
    <html>
    <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Poppins', sans-serif !important; }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Poppins', sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; color: #1e293b; padding: 48px 40px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <div style="text-align: center; margin-bottom: 32px;">
                <img src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1775284858/profile_avatars/ahhwaxgntxhxsu3ifoa9.png" alt="FGrow" style="width: 80px; height: 80px; border-radius: 16px; margin-bottom: 16px;">
                <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: -0.02em; font-weight: 700;">Welcome back! ✨</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Hello ${user.name?.split(" ")[0]}, your account is now fully active.</p>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                <p style="font-size: 14px; line-height: 1.7; color: #334155; margin: 0; text-align: justify;">
                    Your account has been successfully verified and accessed. We're excited to see you continue your journey with FGrow. 
                    Manage your clients, focus on your tasks, and automate your billing all in one place.
                </p>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Status</td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 16px; font-size: 16px; color: #22c55e; font-weight: 700;">Authorized & Verified</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Access Time</td>
                    </tr>
                    <tr>
                        <td style="font-size: 16px; color: #1e293b; font-weight: 600;">${loginTime}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 40px 0;">
                <a href="https://fgrow.forgegrid.in/dashboard" style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff !important; text-decoration: none; padding: 18px 36px; border-radius: 12px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);">
                    Launch My Dashboard →
                </a>
            </div>

            <div style="text-align: center; margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                    Built by the <strong>ForgeGrid Team</strong>
                </p>
            </div>
        </div>
    </body>
    </html>
    `,
      }).catch(e => logger.error("Failed to send 1st login welcome email", e));
    }
    return sendAuthSuccess(res, user);
  } catch (err) {
    logger.error("Login User error:", err);
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
    const { email, token, otp, newPassword } = req.body;

    if (!email || (!token && !otp) || !newPassword) {
      return res.status(400).json({
        message: "email, (token or otp) and new password required",
      });
    }

    const resetValue = token || otp;
    const hashedValue = crypto.createHash("sha256").update(resetValue).digest("hex");

    const user = await User.findOne({
      email,
      reset_token: hashedValue,
      reset_token_expiry: { $gt: Date.now() },
    }).select("+password_hash +locked_until +lockout_level");

    if (!user) {
      return res.status(400).json({ message: "invalid or expired token/otp" });
    }

    user.password = newPassword;
    user.reset_token = undefined;
    user.reset_token_expiry = undefined;
    user.locked_until = undefined;
    user.failed_login_attempts = 0;
    user.lockout_level = 0;
    user.last_login_at = new Date();

    await user.save();

    return res.status(200).json({
      message: "password reset successful — please login",
    });
  } catch (err) {
    logger.error("Reset Password error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};


/**
 * logoutUser
 */
export const logoutUser = async (req, res) => {
  try {
    // Clear cookie with identical metadata but omitting maxAge/expires
    res.clearCookie("auth_token", {
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      path: COOKIE_OPTIONS.path,
    });

    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, { status: "inactive" });
    }

    return res.status(200).json({ message: "logged out" });
  } catch (err) {
    logger.error("Logout User error:", err);
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
      }).populate("tenant_id");

      if (invitation) {
        return res.status(200).json({
          message: "User Invited",
          state: "INVITED",
          user,
          invitation: {
            tenantName: invitation.tenant_id?.name || null,
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

    const tenant = await Tenant.findById(user.tenant_id)
      .select(
        "name companyEmail companyPhone gstNumber registrationNumber companyAddress timezone currency verificationStatus verifiedBy verifiedAt rejection_reason isActive createdAt plan appealCount trialEndDate",
      )
      .populate("verifiedBy", "name email");

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
            plan: req.user.platform_role === "super_admin" ? "pro" : tenant.plan,
            trialEndDate: req.user.platform_role === "super_admin" ? null : tenant.trialEndDate,
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
            plan: req.user.platform_role === "super_admin" ? "pro" : tenant.plan,
            trialEndDate: req.user.platform_role === "super_admin" ? null : tenant.trialEndDate,
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
            companyEmail: tenant.companyEmail,
            companyPhone: tenant.companyPhone,
            gstNumber: tenant.gstNumber,
            registrationNumber: tenant.registrationNumber,
            companyAddress: tenant.companyAddress,
            timezone: tenant.timezone,
            currency: tenant.currency,
            verificationStatus: tenant.verificationStatus,
            rejection_reason: tenant.rejection_reason,
            appealCount: tenant.appealCount,
            verifiedBy: tenant.verifiedBy,
            verifiedAt: tenant.verifiedAt,
          },
        });
    }
  } catch (err) {
    logger.error("Get Me error:", err);
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
      return res.status(200).json({
        message: "user not found",
        found: false
      });
    }

    return res.status(200).json({
      message: "profile preview fetched",
      found: true,
      preview: {
        username: user.name || user.username,
        avatar: user.profile_avatar?.secure_url || "",
      },
    });

  } catch (err) {
    logger.error("User Preview error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};
