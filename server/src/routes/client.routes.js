// routes/client.routes.js
import express from "express";
import * as clientController from "../controllers/client.controller.js";
import authMiddleware from "../middleware/auth.middleware.js"; // your auth middleware

const router = express.Router();

// All endpoints require authMiddleware and will use tenant_id from req.user
router.use(authMiddleware);

// POST /api/clients
router.post("/", clientController.createClient);

// GET /api/clients (list with pagination + filters)
router.get("/", clientController.listClients);

// GET /api/clients/:id
router.get("/:id", clientController.getClient);

// PATCH /api/clients/:id
router.patch("/:id", clientController.updateClient);

// DELETE /api/clients/:id  -> archive
router.delete("/:id", clientController.deleteClient);

export default router;