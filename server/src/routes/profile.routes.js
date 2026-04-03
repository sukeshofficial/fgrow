import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
    updateProfile,
    requestPasswordOTP,
    verifyPasswordOTP,
    unlinkTenant,
    updateAvatar
} from "../controller/profile.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.put("/update", updateProfile);
router.post("/request-password-otp", requestPasswordOTP);
router.post("/verify-password-otp", verifyPasswordOTP);
router.post("/unlink-tenant", unlinkTenant);
router.put("/avatar", upload.single("avatar"), updateAvatar);

export default router;
