import express from "express";
import {
  createTagController,
  listTagsController,
  getTagController,
  updateTagController,
  deleteTagController,
} from "../controller/tag.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { cacheMiddleware, clearCacheMiddleware } from "../middleware/cache.js";

import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();
const authStaff = [authMiddleware, requireRole("owner", "staff")];

router.post("/", ...authStaff, clearCacheMiddleware("v0/tags"), createTagController);
router.get("/", ...authStaff, cacheMiddleware(300), listTagsController);
router.get("/:id", ...authStaff, cacheMiddleware(300), getTagController);
router.patch("/:id", ...authStaff, clearCacheMiddleware("v0/tags"), updateTagController);
router.delete("/:id", ...authStaff, clearCacheMiddleware("v0/tags"), deleteTagController);


export default router;