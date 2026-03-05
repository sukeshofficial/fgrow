import express from "express";
import {
    createClientGroupController,
    listClientGroupsController,
    getClientGroupController,
    updateClientGroupController,
    deleteClientGroupController
} from "../controller/clientGroup.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, requireRole("owner", "staff"), createClientGroupController);
router.get("/", authMiddleware, requireRole("owner", "staff"), listClientGroupsController);
router.get("/:id", authMiddleware, requireRole("owner", "staff"), getClientGroupController);
router.patch("/:id", authMiddleware, requireRole("owner", "staff"), updateClientGroupController);
router.delete("/:id", authMiddleware, requireRole("owner", "staff"), deleteClientGroupController);

export default router;