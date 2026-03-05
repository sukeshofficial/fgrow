import express from "express";
import {
  createClientController,
  listClientsController,
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

export default router;
