export const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.platformRole !== "super_admin") {
        return res.status(403).json({
            message: "Access denied: Super Admin only",
        });
    }

    next();
};