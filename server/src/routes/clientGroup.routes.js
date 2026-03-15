import express from "express";
import {
  createClientGroupController,
  listClientGroupsController,
  getClientGroupController,
  updateClientGroupController,
  deleteClientGroupController,
} from "../controller/clientGroup.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();
const authStaff = [authMiddleware, requireRole("owner", "staff")];

router.post("/", ...authStaff, createClientGroupController);
router.get("/", ...authStaff, listClientGroupsController);
router.get("/:id", ...authStaff, getClientGroupController);
router.patch("/:id", ...authStaff, updateClientGroupController);
router.delete("/:id", ...authStaff, deleteClientGroupController);

export default router;