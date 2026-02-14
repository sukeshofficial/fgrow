// routes/auth.routes.js
import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  loginUser,
  registerUser,
  verifyOtp,
  resendSignupOtp,
  logoutUser,
  getMe
} from "../controllers/auth.controller.js";

const router = Router();

// Register accepts a single image file 'avatar' (profile)
router.post("/register", upload.single("avatar"), registerUser);
router.post("/verify-signup-otp", verifyOtp);
router.post("/resend-verify-otp", resendSignupOtp);
router.post("/login", loginUser);
router.get("/logout", authMiddleware, logoutUser);
router.get("/me", authMiddleware, getMe);

export default router;
