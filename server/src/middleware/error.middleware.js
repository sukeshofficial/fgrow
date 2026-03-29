import multer from "multer";
import logger from "../utils/logger.js";

export const errorMiddleware = (err, req, res, next) => {
  logger.error("Error Middleware Caught:", err);

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File is too large. Max limit is 2MB.",
      });
    }
    return res.status(400).json({
      message: `Upload error: ${err.message}`,
    });
  }

  // Handle custom errors with status
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
