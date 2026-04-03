import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import * as billingController from "../controller/billing.controller.js";

const router = express.Router();

// Webhook must be public and handle raw body (configured in app.js)
router.post("/webhook", billingController.handleWebhook);

// Protected routes
router.use(authMiddleware);

router.post("/create-order", billingController.createOrder);
router.post("/verify-payment", billingController.verifyPayment);
router.get("/status", billingController.getBillingStatus);
router.get("/history", billingController.getPaymentHistory);
router.get("/plans", billingController.getPlans);
router.post("/downgrade", billingController.downgradeSubscription);

export default router;
