import express from "express";
import { listBillingEntities, createBillingEntity } from "../controller/billingEntity.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, listBillingEntities);
router.post("/", authMiddleware, createBillingEntity);

export default router;
