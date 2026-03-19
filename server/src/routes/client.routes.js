import express from "express";
import {
  createClientController,
  listClientsController,
  getClientByIdController,
  updateClientController,
  deleteClientController,
  uploadClientPhotoController,
} from "../controller/client.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

const authStaff = [authMiddleware, requireRole("owner", "staff")];

router.post("/", ...authStaff, createClientController);
router.post("/upload-photo", ...authStaff, upload.single("photo"), uploadClientPhotoController);
router.get("/", ...authStaff, listClientsController);
router.get("/:id", ...authStaff, getClientByIdController);
router.patch("/:id", ...authStaff, updateClientController);
router.delete("/:id", ...authStaff, deleteClientController);

export default router;
