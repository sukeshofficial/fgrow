// middleware/auth.middleware.js
// -----------------------------
// Module purpose:
// - Authenticate incoming requests by verifying JWT token provided either
//   in cookie (auth_token) or Authorization header.
// - Load fresh user document (safe fields) and attach `req.user` for handlers.
//
// Function-level documentation approach:
// - The middleware verifies token, extracts userId, loads user from DB,
//   checks for account lock, and attaches the minimal user object to request.
// - If account is locked, returns 423 to prevent token use until unlock.

import jwt from "jsonwebtoken";
import { User } from "../config/userModel.js";

export default async function authMiddleware(req, res, next) {
  try {
    let token = null;

    if (req.cookies && req.cookies.auth_token) token = req.cookies.auth_token;
    else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    }

    if (!token) return res.status(401).json({ message: "unauthorized: token missing" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "unauthorized: invalid token" });
    }

    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) return res.status(401).json({ message: "unauthorized: token missing user id" });

    // Load fresh user to ensure account still exists and check fields like locked_until
    const user = await User.findById(userId).select("-password_hash -reset_token -reset_token_expiry -locked_until");
    if (!user) return res.status(401).json({ message: "unauthorized: user not found" });


    if (user.locked_until && user.locked_until.getTime() > Date.now()) {
      return res.status(423).json({ message: 'account locked' });
    }

    req.user = { id: user._id, role: user.globalRole || user.role, data: user };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
}