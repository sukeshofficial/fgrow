import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import * as billingController from "../controller/billing.controller.js";
import { cacheMiddleware, clearCacheMiddleware } from "../middleware/cache.js";


const router = express.Router();

// Webhook must be public and handle raw body (configured in app.js)
router.post("/webhook", billingController.handleWebhook);

// Protected routes
router.use(authMiddleware);

router.post("/create-order", billingController.createOrder);
router.post("/verify-payment", clearCacheMiddleware("v0/billing"), billingController.verifyPayment);
router.post("/verify-manual", clearCacheMiddleware("v0/billing"), billingController.verifyManualPayment);
router.get("/status", cacheMiddleware(300), billingController.getBillingStatus);
router.get("/history", cacheMiddleware(300), billingController.getPaymentHistory);
router.get("/plans", cacheMiddleware(3600), billingController.getPlans);

router.post("/downgrade", billingController.downgradeSubscription);

export default router;
