import express from "express";

import {
  createDscController,
  listDscController,
  getDscController,
  updateDscController,
  deleteDscController
} from "../controller/dsc.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

const authStaff = [authMiddleware, requireRole("owner", "staff")];
const authOwner = [authMiddleware, requireRole("owner")];
const authOwnerStaff = authStaff;

router.post("/", ...authStaff, createDscController);
router.get("/", ...authOwnerStaff, listDscController);
router.get("/:id", ...authOwnerStaff, getDscController);
router.patch("/:id", ...authStaff, updateDscController);
router.delete("/:id", ...authStaff, deleteDscController);

export default router;
