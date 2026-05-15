import Tenant from "../models/tenant/tenant.model.js";
import logger from "../utils/logger.js";

/**
 * Tenant Access Middleware
 *
 * Purpose:
 * - Block non-super-admin tenants that have been manually restricted by admin.
 * - Block non-super-admin tenants that have exceeded their grace period
 *   (accessGracePeriodDays days from verifiedAt).
 *
 * SUPER_ADMIN is always bypassed.
 * Certain paths (auth, billing, health) are always allowed.
 */

const ALLOWED_PATHS = [
    "/api/v0/auth/me",
    "/api/v0/auth/logout",
    "/api/v0/auth/refresh",
    "/api/v0/billing",
    "/api/v0/health",
    "/api/v0/support",
    "/api/v0/tenant/staff",
];

export default async function tenantAccessMiddleware(req, res, next) {
    try {
        // 1. Skip if no user attached (unauthenticated — auth middleware handles this)
        if (!req.user) return next();

        // 2. SUPER_ADMIN is never restricted
        if (req.user.platform_role === "super_admin") return next();

        // 3. Skip users without a tenant (they can't be restricted by this rule)
        if (!req.user.tenant_id) return next();

        // 4. Always allow access to essential paths
        const isAllowedPath = ALLOWED_PATHS.some((p) =>
            req.originalUrl.startsWith(p)
        );
        if (isAllowedPath) return next();

        // 5. Fetch the tenant's access restriction fields
        const tenant = await Tenant.findById(req.user.tenant_id).select(
            "name accessRestricted accessGracePeriodDays accessRestrictedAt verifiedAt verificationStatus accessRestrictionReason"
        );

        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found" });
        }

        // 6. Only apply to verified tenants (pending/rejected have their own flow)
        if (tenant.verificationStatus !== "verified") return next();

        // 7. Manual restriction — hard block regardless of grace period
        if (tenant.accessRestricted) {
            logger.warn(
                `Access denied (manual restriction) for tenant ${req.user.tenant_id}`
            );
            return res.status(403).json({
                message:
                    "Your organization's access has been temporarily restricted by an administrator. Please contact support.",
                code: "ACCESS_RESTRICTED",
                reason: tenant.accessRestrictionReason,
                tenantName: tenant.name,
            });
        }

        // 8. Grace period check — auto-restriction based on verifiedAt
        if (tenant.verifiedAt) {
            const gracePeriodDays = tenant.accessGracePeriodDays ?? 30;
            const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;
            const elapsedMs = Date.now() - new Date(tenant.verifiedAt).getTime();

            if (elapsedMs > gracePeriodMs) {
                const daysOverdue = Math.floor(
                    (elapsedMs - gracePeriodMs) / (24 * 60 * 60 * 1000)
                );
                logger.warn(
                    `Access denied (grace period expired by ${daysOverdue} days) for tenant ${req.user.tenant_id}`
                );
                return res.status(403).json({
                    message: `Your ${gracePeriodDays}-day access period has ended (expired ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} ago). Please contact support to continue.`,
                    code: "GRACE_PERIOD_EXPIRED",
                    daysOverdue,
                    gracePeriodDays,
                    verifiedAt: tenant.verifiedAt,
                    tenantName: tenant.name,
                });
            }
        }

        next();
    } catch (err) {
        logger.error("Tenant access middleware error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
