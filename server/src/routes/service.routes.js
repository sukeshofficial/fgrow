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
  listServicesByTenantController
} from "../controller/service.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";
import { cacheMiddleware, clearCacheMiddleware } from "../middleware/cache.js";


const router = express.Router();
const authStaff = [authMiddleware, requireRole("owner", "staff")];

router.post("/", ...authStaff, clearCacheMiddleware("v0/services"), createServiceController);
router.get("/", ...authStaff, cacheMiddleware(300), listServicesController);
router.get("/tenant-list", ...authStaff, cacheMiddleware(300), listServicesByTenantController);
router.get("/:id", ...authStaff, cacheMiddleware(300), getServiceByIdController);
router.patch("/:id", ...authStaff, clearCacheMiddleware("v0/services"), updateServiceController);
router.delete("/:id", ...authStaff, clearCacheMiddleware("v0/services"), deleteServiceController);


router.post("/:id/assign-clients", ...authStaff, clearCacheMiddleware("v0/services"), assignServiceToClientsController);
router.get("/:id/clients", ...authStaff, cacheMiddleware(300), listAssignedClientsController);
router.delete("/:id/clients/:clientId", ...authStaff, clearCacheMiddleware("v0/services"), unassignClientController);


export default router;
