// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { User } from "../config/userModel.js";

/**
 * Auth middleware:
 * - Reads token from cookie or Authorization header
 * - Verifies JWT
 * - Loads user from DB (strips sensitive fields) and attaches to req.user
 */
export default async function authMiddleware(req, res, next) {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
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

    // Optionally check if account is locked: (Nice to have: account lock handling)
    // if (user.locked_until && user.locked_until > Date.now()) return res.status(403).json({ message: "account locked" });

    req.user = { id: user._id, role: user.globalRole || user.role, data: user };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
}

/**
 * Role-check middleware factory
 * Usage: router.post('/admin-only', authMiddleware, requireRole('admin'), handler)
 */
export const requireRole = (role) => (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "unauthorized" });
    if (req.user.role !== role) return res.status(403).json({ message: "forbidden" });
    next();
  } catch (err) {
    console.error("requireRole error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/* Nice to have:
 - Token rotation / refresh tokens to improve security for long sessions.
 - Better error codes + structured error objects.
*/
