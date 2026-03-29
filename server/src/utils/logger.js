import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format for development/console
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    return `${timestamp} [${level}]: ${stack || message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
        }`;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }), // capture stack trace
        process.env.NODE_ENV === "production" ? winston.format.json() : devFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize(),
                process.env.NODE_ENV === "production" ? winston.format.json() : devFormat
            ),
        }),
    ],
});

export default logger;
