import express from "express";
import {
  createCollectionRequestController,
  listCollectionRequestsController,
  getCollectionRequestController,
  updateCollectionRequestController,
  deleteCollectionRequestController,
  changeCollectionRequestStatusController,
  attachDocumentsController,
  removeDocumentFromRequestController
} from "../controller/documentCollectionRequest.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";
import { uploadFiles } from "../middleware/upload.middleware.js";

const router = express.Router();

const authStaff = [authMiddleware, requireRole("owner", "staff")];
const authOwner = [authMiddleware, requireRole("owner")];
const authOwnerStaff = authStaff;

router.post("/", ...authStaff, createCollectionRequestController);
router.get("/", ...authOwnerStaff, listCollectionRequestsController);
router.post("/:id/documents", ...authStaff, uploadFiles.array("files"), attachDocumentsController);
router.post("/:id/status", ...authStaff, changeCollectionRequestStatusController);
router.delete("/:id/documents/:fileId", ...authStaff, removeDocumentFromRequestController);
router.get("/:id", ...authOwnerStaff, getCollectionRequestController);
router.patch("/:id", ...authStaff, updateCollectionRequestController);
router.delete("/:id", ...authStaff, deleteCollectionRequestController);

export default router;