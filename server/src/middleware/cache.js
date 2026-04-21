import NodeCache from "node-cache";

// Initialize cache with 5 minutes default TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Cache middleware for Express routes
 * @param {number} ttl - Time to live in seconds
 */
export const cacheMiddleware = (ttl) => (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
        return next();
    }

    // Include userId in key to prevent cross-user cache pollution
    const userId = req.user?._id || req.user?.id || "anonymous";
    const key = `${userId}:${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        return res.json(cachedResponse);
    }


    // Override res.json to store the response in cache
    const originalJson = res.json;
    res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Ensure we cache a plain object to avoid Mongoose cloning issues
            const plainBody = JSON.parse(JSON.stringify(body));
            cache.set(key, plainBody, ttl);
        }
        return originalJson.call(res, body);
    };



    next();
};

/**
 * Invalidate cache for a specific key pattern
 * @param {string|string[]} patterns - Key patterns to clear
 */
export const clearCacheMiddleware = (patterns) => (req, res, next) => {
    const originalJson = res.json;
    res.json = (body) => {
        // Only clear cache on successful mutations
        if (res.statusCode >= 200 && res.statusCode < 400) {
            const keysToClear = Array.isArray(patterns) ? patterns : [patterns];
            const allKeys = cache.keys();

            keysToClear.forEach(pattern => {
                const matchedKeys = allKeys.filter(k => k.includes(pattern));
                cache.del(matchedKeys);
            });
        }
        return originalJson.call(res, body);
    };
    next();
};


export default cache;
