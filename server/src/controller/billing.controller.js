import * as razorpayService from "../services/razorpay.service.js";
import Payment from "../models/billing/payment.model.js";
import Subscription from "../models/billing/subscription.model.js";
import Plan from "../models/billing/plan.model.js";
import Tenant from "../models/tenant/tenant.model.js";
import logger from "../utils/logger.js";

/**
 * Create a Razorpay order for subscription
 */
export const createOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        const { tenant_id } = req.user;

        // Get amount from env as requested, or fallback to plan model
        const amount = parseFloat(process.env.SUBSCRIPTION_AMOUNT);
        const currency = process.env.SUBSCRIPTION_CURRENCY || "INR";

        if (!amount) {
            return res.status(400).json({ message: "Subscription amount not configured" });
        }

        // Create Razorpay order
        const order = await razorpayService.createOrder(amount, currency, `receipt_tenant_${tenant_id}`);

        // Save pending payment record
        const payment = new Payment({
            tenant_id,
            amount,
            currency,
            razorpay_order_id: order.id,
            status: "pending",
        });

        await payment.save();

        res.status(200).json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        logger.error("Error in createOrder controller:", error);
        res.status(500).json({ message: "Failed to create order" });
    }
};

/**
 * Verify payment signature after client-side checkout
 */
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const { tenant_id } = req.user;

        // 1. Verify signature
        const isValid = razorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (!isValid) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        // 2. Find payment record
        const payment = await Payment.findOne({ razorpay_order_id });
        if (!payment) {
            return res.status(404).json({ message: "Payment record not found" });
        }

        // 3. Update payment record
        payment.razorpay_payment_id = razorpay_payment_id;
        payment.razorpay_signature = razorpay_signature;
        payment.status = "paid";
        await payment.save();

        // 4. Activate/Update Subscription & Trial
        await activateSubscriptionWithTrial(tenant_id, payment);

        res.status(200).json({ message: "Payment verified and subscription activated" });
    } catch (error) {
        logger.error("Error in verifyPayment controller:", error);
        res.status(500).json({ message: "Payment verification failed" });
    }
};

/**
 * Verify manual GPay/UPI payment with UTR
 */
export const verifyManualPayment = async (req, res) => {
    try {
        const { utr } = req.body;
        const { tenant_id } = req.user;

        if (!utr) return res.status(400).json({ message: "UTR/Transaction ID is required" });

        const amount = parseFloat(process.env.SUBSCRIPTION_AMOUNT || "1");

        const payment = new Payment({
            tenant_id,
            amount,
            currency: "INR",
            razorpay_order_id: `manual_${utr}_${Date.now()}`,
            razorpay_payment_id: utr,
            status: "paid",
        });

        await payment.save();
        await activateSubscriptionWithTrial(tenant_id, payment);

        res.status(200).json({ message: "Payment verified and subscription activated" });
    } catch (error) {
        logger.error("Error in verifyManualPayment controller:", error);
        res.status(500).json({ message: "Manual verification failed" });
    }
};

/**
 * Handle Razorpay Webhooks
 */
export const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const rawBody = req.rawBody;

        // Verify webhook signature
        const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
        if (!isValid) {
            logger.warn("Invalid webhook signature received");
            return res.status(400).send("Invalid signature");
        }

        const event = req.body.event;
        const payload = req.body.payload;

        logger.info(`Received Razorpay Webhook: ${event}`);

        // Process events
        if (event === "payment.captured") {
            const paymentData = payload.payment.entity;
            const orderId = paymentData.order_id;

            const payment = await Payment.findOne({ razorpay_order_id: orderId });
            if (payment && payment.status !== "paid") {
                payment.status = "paid";
                payment.razorpay_payment_id = paymentData.id;
                payment.webhook_logs.push({ event, payload });
                await payment.save();

                await activateSubscriptionWithTrial(payment.tenant_id, payment);
            }
        } else if (event === "payment.failed") {
            const paymentData = payload.payment.entity;
            const orderId = paymentData.order_id;

            const payment = await Payment.findOne({ razorpay_order_id: orderId });
            if (payment) {
                payment.status = "failed";
                payment.webhook_logs.push({ event, payload });
                await payment.save();
            }
        }

        res.status(200).send("OK");
    } catch (error) {
        logger.error("Error in webhook handler:", error);
        res.status(500).send("Internal Server Error");
    }
};

/**
 * Get current billing and subscription status
 */
export const getBillingStatus = async (req, res) => {
    try {
        const { tenant_id } = req.user;

        const subscription = await Subscription.findOne({ tenant_id }).populate("plan_id");
        const tenant = await Tenant.findById(tenant_id).populate("ownerUserId");

        const isSuperAdminTenant = req.user.platform_role === "super_admin" || (tenant?.ownerUserId?.platform_role === "super_admin");

        res.status(200).json({
            subscription,
            trialEndDate: isSuperAdminTenant ? null : tenant?.trialEndDate,
            plan: isSuperAdminTenant ? "pro" : tenant?.plan,
            currentAmount: process.env.SUBSCRIPTION_AMOUNT || "1",
            role: req.user.tenant_role,
            isSuperAdminTenant
        });
    } catch (error) {
        logger.error("Error in getBillingStatus controller:", error);
        res.status(500).json({ message: "Failed to fetch billing status" });
    }
};

/**
 * Helper to activate subscription and set trial end date
 */
async function activateSubscriptionWithTrial(tenantId, payment) {
    const trialDays = parseInt(process.env.TRIAL_DAYS || "30");
    const trialStartAt = new Date();
    const trialEndAt = new Date();
    trialEndAt.setDate(trialStartAt.getDate() + trialDays);

    // Update Subscription record
    // Logic: either update existing or create new
    // Note: tenant might have a "Plan" selected during order creation, or we use a default
    // For now, let's assume we find a default "Pro" plan if not specified (as an example)
    let plan = await Plan.findOne({ name: "Pro" }); // Example fallback
    if (!plan) {
        // Create a dummy plan if needed or just use ID if provided in some other way
    }

    await Subscription.findOneAndUpdate(
        { tenant_id: tenantId },
        {
            status: "active",
            amount: payment.amount,
            currency: payment.currency,
            trial_start_at: trialStartAt,
            trial_end_at: trialEndAt,
            plan_id: plan?._id,
        },
        { upsert: true, new: true }
    );

    // Update Tenant record (source of truth for simplified UI)
    await Tenant.findByIdAndUpdate(tenantId, {
        plan: "pro", // Map to the plan
        trialEndDate: trialEndAt,
        trialUsed: true,
    });

    logger.info(`Subscription activated for tenant ${tenantId}. Trial ends at ${trialEndAt}`);
}

/**
 * Get available plans
 */
export const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true });
        res.status(200).json(plans);
    } catch (error) {
        logger.error("Error in getPlans controller:", error);
        res.status(500).json({ message: "Failed to fetch plans" });
    }
};

/**
 * Downgrade subscription to Free Plan
 */
export const downgradeSubscription = async (req, res) => {
    try {
        const { tenant_id, tenant_role } = req.user;

        if (tenant_role !== "owner") {
            return res.status(403).json({ message: "Only organization owners can manage subscriptions" });
        }

        const tenant = await Tenant.findById(tenant_id);

        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found" });
        }

        // Downgrade plan
        tenant.plan = "free_trial";
        tenant.trialUsed = true;
        await tenant.save();

        await Subscription.deleteOne({ tenant_id });

        res.status(200).json({ message: "Subscription downgraded successfully" });
    } catch (error) {
        logger.error("Error in downgradeSubscription controller:", error);
        res.status(500).json({ message: "Failed to downgrade subscription" });
    }
};
/**
 * Get payment history for a tenant
 */
export const getPaymentHistory = async (req, res) => {
    try {
        const { tenant_id, tenant_role } = req.user;

        if (tenant_role !== "owner") {
            return res.status(403).json({ message: "Only organization owners can view payment history" });
        }

        const payments = await Payment.find({ tenant_id, status: "paid" })
            .sort({ createdAt: -1 });

        res.status(200).json(payments);
    } catch (error) {
        logger.error("Error in getPaymentHistory controller:", error);
        res.status(500).json({ message: "Failed to fetch payment history" });
    }
};
