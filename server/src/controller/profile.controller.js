import { User } from "../models/auth/user.model.js";
import Tenant from "../models/tenant/tenant.model.js";
import { uploadBufferToCloud } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";
import crypto from "crypto";

/**
 * Update User Profile (Name)
 */
export const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.name = name || user.name;
        await user.save();

        res.json({ message: "Profile updated successfully", user: user.toJSON() });
    } catch (err) {
        logger.error("Error updating profile:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Request OTP for Password Change
 */
export const requestPasswordOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("+email");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp_code = otp;
        user.otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

        await user.save();

        // Send Email
        await sendEmail({
            to: user.email,
            subject: "Your ForgeGrid Verification Code",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb; text-align: center;">Security Verification</h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>You requested to change your password. Use the following 6-digit code to verify your identity. This code is valid for <strong>10 minutes</strong>.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 14px;">If you didn't request this, please secure your account immediately.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">ForgeGrid Security Team</p>
        </div>
      `,
        });

        res.json({ message: "OTP sent to your email" });
    } catch (err) {
        logger.error("Error requesting OTP:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Verify OTP and Update Password
 */
export const verifyPasswordOTP = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        const user = await User.findById(req.user.id).select("+otp_code +otp_expiry");

        if (!user || user.otp_code !== otp || new Date() > user.otp_expiry) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Update password (pre-save hook hashes it)
        user.password = newPassword;
        user.otp_code = undefined;
        user.otp_expiry = undefined;

        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        logger.error("Error verifying OTP:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Unlink Self from Tenant (Staff only)
 */
export const unlinkTenant = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.tenant_role === "owner") {
            return res.status(400).json({ message: "Owners cannot unlink. Transfer ownership or delete the organization first." });
        }

        user.tenant_id = null;
        user.tenant_role = "none";
        await user.save();

        res.json({ message: "Unlinked from organization successfully" });
    } catch (err) {
        logger.error("Error unlinking tenant:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Update Profile Avatar
 */
export const updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Upload new avatar
        const result = await uploadBufferToCloud(req.file.buffer, "profile_avatars");

        if (!result.success) {
            return res.status(500).json({ message: "Failed to upload image to cloud" });
        }

        // Delete old avatar if it exists
        if (user.profile_avatar?.public_id) {
            try {
                await cloudinary.uploader.destroy(user.profile_avatar.public_id);
            } catch (err) {
                logger.error("Error deleting old avatar:", err);
            }
        }

        // Update DB
        user.profile_avatar = {
            public_id: result.public_id,
            secure_url: result.secure_url
        };
        await user.save();

        res.json({
            message: "Avatar updated successfully",
            profile_avatar: user.profile_avatar
        });
    } catch (err) {
        logger.error("Error updating avatar:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
