import express from "express";
import {
  createClientController,
  listClientsController,
  getClientByIdController,
  updateClientController,
  deleteClientController,
} from "../controller/client.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole("owner", "staff"),
  createClientController,
);
router.get(
  "/",
  authMiddleware,
  requireRole("owner", "staff"),
  listClientsController,
);
router.get("/:id", authMiddleware, requireRole("owner", "staff"), getClientByIdController);
router.patch("/:id", authMiddleware, requireRole("owner", "staff"), updateClientController);
router.delete("/:id", authMiddleware, requireRole("owner", "staff"), deleteClientController);

export default router;
