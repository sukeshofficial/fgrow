// server/src/middleware/spam.middleware.js

// In-memory storage for cooldowns and last content
// For high-scale production, this should use Redis
const cooldowns = new Map();
const lastComments = new Map();

/**
 * Middleware to prevent rapid-fire interactions and duplicate comments.
 * 10-second cooldown per user/IP.
 */
export const spamProtection = (req, res, next) => {
    const userId = req.user?.id || req.ip || "unknown";
    const now = Date.now();
    const COOLDOWN_MS = 10000; // 10 seconds

    // 1. Check Rate Limit
    if (cooldowns.has(userId)) {
        const lastAction = cooldowns.get(userId);
        const timePassed = now - lastAction;

        if (timePassed < COOLDOWN_MS) {
            const waitSeconds = Math.ceil((COOLDOWN_MS - timePassed) / 1000);
            return res.status(429).json({
                success: false,
                message: `Slow down! Please wait ${waitSeconds}s before your next interaction.`
            });
        }
    }

    // 2. Check for Duplicate Comments
    // Only applies to POST requests with 'content' (like comments)
    if (req.method === "POST" && req.body.content) {
        const content = req.body.content.trim();
        const lastContent = lastComments.get(userId);

        if (content === lastContent) {
            return res.status(400).json({
                success: false,
                message: "Duplicate content detected. Please try something different."
            });
        }

        // Cache last content
        lastComments.set(userId, content);
    }

    // Update cooldown
    cooldowns.set(userId, now);

    // Optional: Periodically clean up maps to prevent memory leaks
    if (cooldowns.size > 10000) {
        cooldowns.clear();
        lastComments.clear();
    }

    next();
};
