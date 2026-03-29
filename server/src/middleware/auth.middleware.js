// middleware/auth.middleware.js
/**
 * Authentication middleware
 *
 * Purpose:
 * - Authenticate incoming requests using JWT.
 * - Accept token from cookie (auth_token) or Authorization header.
 * - Load fresh user document and attach minimal user data to req.user.
 *
 * Behavior:
 * - Verifies token and extracts user ID
 * - Ensures user exists and is not locked
 * - Blocks access with proper HTTP status codes
 */

import jwt from "jsonwebtoken";
import { User } from "../models/auth/user.model.js";
import logger from "../utils/logger.js";

export default async function authMiddleware(req, res, next) {
  try {
    let token = null;

    // Extract token from cookie or Authorization header
    if (req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    } else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;
    }

    if (!token) {
      return res.status(401).json({ message: "unauthorized: token missing" });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "unauthorized: invalid token" });
    }

    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({
        message: "unauthorized: token missing user id",
      });
    }

    // Load fresh user and validate account state
    const user = await User.findById(userId).select(
      "name email tenant_id platform_role tenant_role status profile_avatar",
    );

    if (!user) {
      return res.status(401).json({ message: "unauthorized: user not found" });
    }

    // Block access if account is locked
    if (user.locked_until && user.locked_until.getTime() > Date.now()) {
      return res.status(423).json({ message: "account locked" });
    }

    // Dynamic Platform Role check (ensure .env list is respected)
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim());
    const isSuperAdmin = superAdminEmails.includes(user.email);

    // Attach minimal user object to request
    req.user = {
      id: user._id,
      tenant_id: user.tenant_id,
      platformRole: isSuperAdmin ? "super_admin" : user.platform_role,
      tenant_role: user.tenant_role,
      status: user.status,
      data: user,
    };

    next();
  } catch (err) {
    logger.error("Auth middleware error:", err);
    // Common misconfiguration: JWT_SECRET not set in environment
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration: JWT_SECRET not set" });
    }
    return res.status(500).json({ message: "internal server error" });
  }
}


