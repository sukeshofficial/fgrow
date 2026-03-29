/**
 * Centralized Logger Utility for Frontend
 * 
 * Rules:
 * 1. Environment-aware: verbose in dev, minimal in prod.
 * 2. No sensitive data.
 * 3. Includes context (component/function name).
 */

const IS_DEV = import.meta.env.DEV;

const logger = {
    /**
     * info: user actions, lifecycle events
     */
    info: (context, message, ...data) => {
        if (IS_DEV) {
            console.log(`[INFO][${context}] ${message}`, ...data);
        }
    },

    /**
     * warn: recoverable issues (e.g., fallback UI)
     */
    warn: (context, message, ...data) => {
        if (IS_DEV) {
            console.warn(`[WARN][${context}] ${message}`, ...data);
        }
    },

    /**
     * error: failed API calls, crashes
     */
    error: (context, message, ...data) => {
        // Errors should generally be logged even in production (maybe sent to a monitoring tool)
        console.error(`[ERROR][${context}] ${message}`, ...data);

        // Optional: Integrations with monitoring tools like Sentry could be added here
        // if (import.meta.env.PROD) {
        //   Sentry.captureException(data[0] || new Error(message));
        // }
    },

    /**
     * debug: only in development mode
     */
    debug: (context, message, ...data) => {
        if (IS_DEV) {
            console.debug(`[DEBUG][${context}] ${message}`, ...data);
        }
    }
};

export default logger;
