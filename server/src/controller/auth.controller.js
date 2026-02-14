// controllers/auth.controller.js
import crypto from "crypto";
import { User } from "../config/userModel.js"; // your model. See source. :contentReference[oaicite:6]{index=6}
import sendEmail from "../utils/sendEmail.js"; // assume this exists; keep as your implementation
import { generateToken } from "../utils/jwt.js"; // assume existing helper
import { createNumericOtp, generateUsername } from "../utils/helper.js"; // helpers you referenced
import validator from "validator";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  path: "/",
};

// Helper: send token as cookie + response minimal payload
const sendAuthSuccess = (res, user, payload = {}) => {
  const token = generateToken({ userId: user._id, role: user.globalRole || user.role });
  res.cookie("token", token, COOKIE_OPTIONS);
  // strip sensitive fields (User model has toJSON), but be explicit
  const safe = (typeof user.toJSON === "function") ? user.toJSON() : { ...user };
  return res.status(200).json({ message: "ok", user: safe, ...payload });
};

// Register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const profileAvatarPath = req.file ? req.file.path : "";

    // Basic validations
    if (!email || !password || !name) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "invalid email" });
    }
    const allowedRoles = ["user", "admin"]; // align with user model
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "invalid role" });
    }

    // Check EXISTING by email or username
    const existing = await User.findOne({ $or: [{ email }, { username: generateUsername(email) }] }).lean();
    if (existing) {
      return res.status(409).json({ message: "account already exists" });
    }

    // Build new user using model-level password handling (virtual 'password')
    const username = await generateUsername(email);
    const newUser = new User({
      displayName: name,
      username,
      email,
      profile_avatar: profileAvatarPath,
      globalRole: role || "user"
    });

    // Use virtual to set plain password; model pre-save will hash it.
    newUser.password = password;
    // create reset/verify token using model method (if you have createResetToken)
    // your user model defines createResetToken -> we can reuse that
    const rawOtp = createNumericOtp(); // generate OTP string
    const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");
    newUser.reset_token = hashedOtp;
    newUser.reset_token_expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Save user
    await newUser.save();

    // Send OTP email (raw OTP). Keep email sending async but awaited so caller sees result
    await sendEmail({
      to: email,
      subject: "Your verification code",
      html: `<p>Your verification code is: <strong>${rawOtp}</strong>. It expires in 5 minutes.</p>`,
    });

    // Return created user (model's toJSON removes sensitive fields)
    const safeUser = newUser.toJSON();
    return res.status(201).json({ message: "User registered. Verify email with OTP", user: safeUser });
  } catch (err) {
    console.error("registerUser error:", err);
    // Duplicate key handling (index uniqueness)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(409).json({ message: `${field} already in use` });
    }
    return res.status(500).json({ message: "internal server error" });
  }
};

// Verify signup OTP -> issue JWT cookie
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "email and otp required" });

    const hashed = crypto.createHash("sha256").update(otp).digest("hex");
    const now = Date.now();

    const user = await User.findOne({ email, reset_token: hashed, reset_token_expiry: { $gt: now } }).select("+password_hash");
    if (!user) return res.status(400).json({ message: "invalid or expired otp" });

    // Clear tokens and mark verified (if you track)
    user.reset_token = undefined;
    user.reset_token_expiry = undefined;
    // Optionally set emailVerified boolean (Nice to have)
    await user.save({ validateBeforeSave: false });

    return sendAuthSuccess(res, user, { message: "Email verified and authenticated" });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// Resend OTP
export const resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !validator.isEmail(email)) return res.status(400).json({ message: "valid email required" });

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ message: "no account found for this email" });

    // generate OTP, hash, and save on user via update (do not reveal hashed token)
    const otp = createNumericOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiry = Date.now() + 5 * 60 * 1000;

    await User.updateOne({ email }, { $set: { reset_token: hashedOtp, reset_token_expiry: expiry } });

    await sendEmail({
      to: email,
      subject: "Your verification code",
      html: `<p>Your verification code is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    });

    return res.json({ message: "verification code resent" });
  } catch (err) {
    console.error("resendSignupOtp error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || !validator.isEmail(email)) {
      return res.status(400).json({ message: "email and password required" });
    }

    // request password hash explicitly
    const user = await User.findOne({ email }).select("+password_hash");
    if (!user) return res.status(401).json({ message: "invalid credentials" });

    // Use model comparePassword (handles bcrypt)
    const valid = await user.comparePassword(password);
    if (!valid) {
      // increment failed attempts (simple)
      await User.updateOne({ _id: user._id }, { $inc: { failed_login_attempts: 1 } });
      return res.status(401).json({ message: "invalid credentials" });
    }

    // Reset failed attempts, set last_login
    user.failed_login_attempts = 0;
    user.last_login = new Date();
    await user.save({ validateBeforeSave: false });

    return sendAuthSuccess(res, user, { message: "logged in" });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// Logout
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", COOKIE_OPTIONS);
    return res.status(200).json({ message: "logged out" });
  } catch (err) {
    console.error("logoutUser error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: "missing user in request" });

    const user = await User.findById(userId).select("-password_hash -reset_token -reset_token_expiry -locked_until");
    if (!user) return res.status(404).json({ message: "user not found" });
    return res.status(200).json({ message: "ok", user });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/* Nice to have:
 - Rate limit login & OTP endpoints (prevent brute force).
 - Email verification flag and resend throttling per email.
 - Account lockout & backoff logic when failed_login_attempts exceed threshold.
*/
