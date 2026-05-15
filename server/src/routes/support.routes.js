import express from "express";
import {
    createSupportRequest,
    getAllSupportRequests,
    resolveSupportRequest
} from "../controller/support.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireSuperAdmin } from "../middleware/superAdmin.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();
const authSuperAdmin = [authMiddleware, requireSuperAdmin];

/**
 * Tenant/User Routes
 */
router.post(
    "/",
    authMiddleware,
    upload.single("screenshot"),
    createSupportRequest
);

/**
 * Super Admin Routes
 */
router.get(
    "/all",
    ...authSuperAdmin,
    getAllSupportRequests
);

router.patch(
    "/:requestId/resolve",
    ...authSuperAdmin,
    resolveSupportRequest
);

export default router;
