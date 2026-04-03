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
        if (!req.user || !req.user.tenant_id || req.user.platformRole === "super_admin") {
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

        // 3. Fetch tenant to check trial status
        const tenant = await Tenant.findById(req.user.tenant_id).select("trialEndDate plan");

        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found" });
        }

        // 4. Check Trial Expiry
        // If plan is 'free_trial' and trialEndDate has passed
        if (tenant.plan === "free_trial" || !tenant.plan) {
            const now = new Date();
            if (tenant.trialEndDate && tenant.trialEndDate < now) {
                logger.warn(`Access denied for tenant ${req.user.tenant_id}: Trial expired on ${tenant.trialEndDate}`);
                return res.status(402).json({
                    message: "Your trial has expired. Please upgrade to continue.",
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
