import express from "express";
import { listBillingEntities } from "../controller/billingEntity.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, listBillingEntities);

export default router;
