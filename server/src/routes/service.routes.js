import express from "express";
import {
  createServiceController,
  listServicesController,
  getServiceByIdController,
  updateServiceController,
  deleteServiceController,
  assignServiceToClientsController,
  listAssignedClientsController,
  unassignClientController,
} from "../controller/service.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();
const authStaff = [authMiddleware, requireRole("owner", "staff")];

router.post("/", ...authStaff, createServiceController);
router.get("/", ...authStaff, listServicesController);
router.get("/:id", ...authStaff, getServiceByIdController);
router.patch("/:id", ...authStaff, updateServiceController);
router.delete("/:id", ...authStaff, deleteServiceController);

router.post("/:id/assign-clients", ...authStaff, assignServiceToClientsController);
router.get("/:id/clients", ...authStaff, listAssignedClientsController);
router.delete("/:id/clients/:clientId", ...authStaff, unassignClientController);

export default router;
