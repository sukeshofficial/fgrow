import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  loginUser,
  registerUser,
  verifyOtp,
  resendSignupOtp,
  resetPassword,
  forgotPasswordRequest,
  verifyResetOtp,
  logoutUser,
  getMe,
  userPreview,
} from "../controller/auth.controller.js";

const router = express.Router();

// Public / unauthenticated routes
router.post("/register", upload.single("profile-avatar"), registerUser);
router.post("/verify-signup-otp", verifyOtp);
router.post("/resend-verify-otp", resendSignupOtp);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPasswordRequest);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

// Authenticated routes
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getMe);
router.get("/user-preview", userPreview);

export default router;
