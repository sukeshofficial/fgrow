import express from "express";
import {
  createDocumentTypeController,
  listDocumentTypesController,
  getDocumentTypeController,
  updateDocumentTypeController,
  deleteDocumentTypeController,
} from "../controller/documentType.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

const authStaff = [authMiddleware, requireRole("owner", "staff")];
const authOwner = [authMiddleware, requireRole("owner")];
const authOwnerStaff = authStaff;

router.post("/", authOwnerStaff, createDocumentTypeController);
router.get("/", authOwnerStaff, listDocumentTypesController);
router.get("/:id", authOwnerStaff, getDocumentTypeController);
router.patch("/:id", authOwnerStaff, updateDocumentTypeController);
router.delete("/:id", authOwnerStaff, deleteDocumentTypeController);

export default router;