import express from "express";

import {
    createServiceController,
    listServicesController,
    getServiceByIdController,
    updateServiceController,
    deleteServiceController,
    assignServiceToClientsController,
    listAssignedClientsController,
    unassignClientController
} from "../controller/service.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, requireRole("owner", "staff"), createServiceController);
router.get("/", authMiddleware, requireRole("owner", "staff"), listServicesController);
router.get("/:id", authMiddleware, requireRole("owner", "staff"), getServiceByIdController);
router.patch("/:id", authMiddleware, requireRole("owner", "staff"), updateServiceController);
router.delete("/:id", authMiddleware, requireRole("owner", "staff"), deleteServiceController);
router.post("/:id/assign-clients", authMiddleware, requireRole("owner", "staff"), assignServiceToClientsController);
router.get("/:id/clients", authMiddleware, requireRole("owner", "staff"), listAssignedClientsController);
router.delete("/:id/clients/:clientId", authMiddleware, requireRole("owner", "staff"), unassignClientController);

export default router;