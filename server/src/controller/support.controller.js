import SupportRequest from "../models/system/supportRequest.model.js";
import Tenant from "../models/tenant/tenant.model.js";
import Payment from "../models/billing/payment.model.js";
import Subscription from "../models/billing/subscription.model.js";
import Plan from "../models/billing/plan.model.js";
import { User } from "../models/auth/user.model.js";
import { uploadBufferToCloud } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

/**
 * Submit a Support Request or Payment Proof
 */
export const createSupportRequest = async (req, res) => {
    try {
        const { type, title, body, transactionId } = req.body;
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;

        if (!tenantId) {
            return res.status(400).json({ message: "Tenant context missing" });
        }

        let screenshotUrl = null;
        if (req.file) {
            const uploadResult = await uploadBufferToCloud(req.file.buffer, "support-proofs");
            if (uploadResult.success) {
                screenshotUrl = uploadResult.secure_url;
            }
        }

        const request = new SupportRequest({
            tenantId,
            userId,
            type: type || "support",
            title,
            body,
            screenshotUrl,
            transactionId: type === "payment_proof" ? transactionId : null,
        });

        await request.save();

        // ─── Automated Immediate Access Grant ─────────────────────────────────────
        // Purpose: Honor system. If they submit proof, give them 30 days immediately.
        // This resets their grace period while the admin verifies in the background.
        if (type === "payment_proof") {
            try {
                // 1. Calculate Amount based on staff count
                const staffCount = await User.countDocuments({ tenant_id: tenantId, status: "active" });
                const amount = staffCount * 99;

                // 2. Fetch/Update Plan (Fallback to Pro)
                let plan = await Plan.findOne({ name: "Pro" });
                if (!plan) plan = await Plan.findOne({ isActive: true }).sort({ priceMonthly: -1 });

                // If still no plan exists in DB, create a default Pro plan to avoid validation failure
                if (!plan) {
                    plan = new Plan({
                        name: "Pro",
                        priceMonthly: 99,
                        isActive: true,
                        features: { unlimited_clients: true }
                    });
                    await plan.save();
                }
                const planId = plan._id;

                // 3. Create Payment Record (Manual GPay)
                const payment = new Payment({
                    tenant_id: tenantId,
                    amount,
                    currency: "INR",
                    gateway: "gpay",
                    razorpay_order_id: `manual_gpay_${transactionId}_${Date.now()}`,
                    razorpay_payment_id: transactionId,
                    status: "paid", // Mark as paid for immediate access
                });
                await payment.save();

                // 4. Update/Extend Subscription
                const oneMonth = 30 * 24 * 60 * 60 * 1000;
                let subscription = await Subscription.findOne({ tenant_id: tenantId });

                let newEndDate = new Date(Date.now() + oneMonth);
                if (subscription && subscription.trial_end_at && subscription.trial_end_at > new Date()) {
                    newEndDate = new Date(subscription.trial_end_at.getTime() + oneMonth);
                }

                if (subscription) {
                    subscription.trial_end_at = newEndDate;
                    subscription.status = "active";
                    subscription.amount = amount;
                    if (planId) subscription.plan_id = planId;
                    await subscription.save();
                } else if (planId) {
                    subscription = new Subscription({
                        tenant_id: tenantId,
                        plan_id: planId,
                        status: "active",
                        amount,
                        trial_start_at: new Date(),
                        trial_end_at: newEndDate
                    });
                    await subscription.save();
                }

                // 5. Update Tenant Access
                await Tenant.findByIdAndUpdate(tenantId, {
                    accessRestricted: false,
                    verifiedAt: new Date(), // Reset grace period for restriction logic
                    trialEndDate: newEndDate, // Sync for "Subscription ends" display in settings
                    plan: "pro", // Ensure plan string is updated
                    paymentStatus: "paid",
                    lastPaymentAmount: amount,
                    lastPaymentDate: new Date()
                });

                logger.info(`Full billing update & immediate access granted to tenant ${tenantId} via GPay TxID: ${transactionId}`);
            } catch (billingErr) {
                logger.error("Failed to perform background billing update:", billingErr);
            }
        }

        res.status(201).json({
            message: type === "payment_proof"
                ? "Payment proof submitted successfully! Your access has been restored while we verify the details."
                : "Support request sent successfully",
            request,
        });
    } catch (error) {
        logger.error("Error creating support request:", error);
        res.status(500).json({ message: "Failed to submit request" });
    }
};

/**
 * Get all support requests (Super Admin Only)
 */
export const getAllSupportRequests = async (req, res) => {
    try {
        const requests = await SupportRequest.find()
            .populate("tenantId", "name company_name")
            .populate("userId", "full_name email")
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        logger.error("Error fetching support requests:", error);
        res.status(500).json({ message: "Failed to fetch requests" });
    }
};

/**
 * Resolve/Respond to a support request (Super Admin Only)
 */
export const resolveSupportRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, adminResponse } = req.body;

        const request = await SupportRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (status) request.status = status;
        if (adminResponse !== undefined) request.adminResponse = adminResponse;

        await request.save();

        res.status(200).json({ message: "Request updated successfully", request });
    } catch (error) {
        logger.error("Error updating support request:", error);
        res.status(500).json({ message: "Failed to update request" });
    }
};
