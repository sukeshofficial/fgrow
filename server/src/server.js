import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDB from "./config/initDb.js";
import logger from "./utils/logger.js";
import { initCron } from "./services/cron.service.js";


const start = async () => {
  try {
    await connectDB();
    initCron();


    const server = http.createServer(app);
    const PORT = process.env.PORT || 5000;
    if (process.env.NODE_ENV !== "production") {
      server.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
      });
    }
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();