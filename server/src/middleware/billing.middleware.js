import Tenant from "../models/tenant/tenant.model.js";
import logger from "../utils/logger.js";

/**
 * Billing Middleware
 * 
 * Purpose:
 * - Check if the tenant's trial has expired.
 * - Restrict access to most APIs if trial is over.
 * - Allow access to billing-related endpoints and basic health checks.
 */
export default async function billingMiddleware(req, res, next) {
    try {
        // 1. Skip check for non-tenant routes or super_admin
        if (!req.user || !req.user.tenant_id || req.user.platform_role === "super_admin") {
            return next();
        }

        // 2. Skip check for billing-related paths
        const allowedPaths = [
            "/api/v0/billing",
            "/api/v0/auth/me",
            "/api/v0/auth/logout",
            "/api/v0/health"
        ];

        const isAllowedPath = allowedPaths.some(path => req.originalUrl.startsWith(path));
        if (isAllowedPath) {
            return next();
        }

        // 3. Fetch tenant to check trial & payment status
        const tenant = await Tenant.findById(req.user.tenant_id).select("trialEndDate plan paymentStatus accessGracePeriodDays verifiedAt");

        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found" });
        }

        // 4. Check for hard paymentStatus restriction
        if (tenant.paymentStatus === "overdue") {
            return res.status(402).json({
                message: "Your subscription is overdue. Please complete payment to continue.",
                code: "BILLING_OVERDUE"
            });
        }

        // 5. Check Trial / Grace Period Expiry (if not explicitly active)
        if (tenant.paymentStatus !== "active") {
            const graceDays = tenant.accessGracePeriodDays ?? 30;
            const now = new Date();
            const expirationDate = new Date(tenant.verifiedAt?.getTime() + (graceDays * 24 * 60 * 60 * 1000));

            if (expirationDate < now) {
                logger.warn(`Access denied for tenant ${req.user.tenant_id}: Grace period expired on ${expirationDate}`);
                return res.status(402).json({
                    message: "Your initial access period has expired. Please choose a plan to continue.",
                    code: "TRIAL_EXPIRED"
                });
            }
        }

        next();
    } catch (err) {
        logger.error("Billing middleware error:", err);
        return res.status(500).json({ message: "Internal server error during billing check" });
    }
}
