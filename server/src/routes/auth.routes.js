import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  loginUser,
  registerUser,
  verifyOtp,
  resendSignupOtp,
  resetPassword,
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
router.post("/reset-password", resetPassword);

// Authenticated routes
router.get("/logout", authMiddleware, logoutUser);
router.get("/me", authMiddleware, getMe);
router.get("/user-preview", userPreview);

export default router;
