import express from "express";
import {
  createClientGroupController,
  listClientGroupsController,
  getClientGroupController,
  updateClientGroupController,
  deleteClientGroupController,
} from "../controller/clientGroup.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { cacheMiddleware, clearCacheMiddleware } from "../middleware/cache.js";

import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();
const authStaff = [authMiddleware, requireRole("owner", "staff")];

router.post("/", ...authStaff, clearCacheMiddleware("v0/client-groups"), createClientGroupController);
router.get("/", ...authStaff, cacheMiddleware(300), listClientGroupsController);
router.get("/:id", ...authStaff, cacheMiddleware(300), getClientGroupController);
router.patch("/:id", ...authStaff, clearCacheMiddleware("v0/client-groups"), updateClientGroupController);
router.delete("/:id", ...authStaff, clearCacheMiddleware("v0/client-groups"), deleteClientGroupController);


export default router;