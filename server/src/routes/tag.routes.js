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
const authStaff = [authMiddleware, requireRole("owner", "staff")];

router.post("/", ...authStaff, createTagController);
router.get("/", ...authStaff, listTagsController);
router.get("/:id", ...authStaff, getTagController);
router.patch("/:id", ...authStaff, updateTagController);
router.delete("/:id", ...authStaff, deleteTagController);

export default router;