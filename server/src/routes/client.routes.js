import express from "express";
import {
  createClientController,
  listClientsController,
  getClientByIdController,
  updateClientController,
  deleteClientController,
  uploadClientPhotoController,
  listClientsByTenantIdController,
} from "../controller/client.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import billingMiddleware from "../middleware/billing.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { cacheMiddleware, clearCacheMiddleware } from "../middleware/cache.js";


const router = express.Router();

const authStaff = [authMiddleware, billingMiddleware, requireRole("owner", "staff")];

router.post("/", ...authStaff, clearCacheMiddleware("v0/clients"), createClientController);
router.post("/upload-photo", ...authStaff, clearCacheMiddleware("v0/clients"), upload.single("photo"), uploadClientPhotoController);
router.get("/", ...authStaff, cacheMiddleware(300), listClientsController);
router.get("/tenant-list", ...authStaff, cacheMiddleware(300), listClientsByTenantIdController);
router.get("/:id", ...authStaff, cacheMiddleware(300), getClientByIdController);
router.patch("/:id", ...authStaff, clearCacheMiddleware("v0/clients"), updateClientController);
router.delete("/:id", ...authStaff, clearCacheMiddleware("v0/clients"), deleteClientController);


export default router;
