import express from "express";
import {
    createTagController,
    listTagsController,
    getTagController,
    updateTagController,
    deleteTagController,
} from "../controller/tag.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, requireRole("owner", "staff"), createTagController);
router.get("/", authMiddleware, requireRole("owner", "staff"), listTagsController);
router.get("/:id", authMiddleware, requireRole("owner", "staff"), getTagController);
router.patch("/:id", authMiddleware, requireRole("owner", "staff"), updateTagController);
router.delete("/:id", authMiddleware, requireRole("owner", "staff"), deleteTagController);

export default router;