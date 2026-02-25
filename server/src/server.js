import http from "http";
import dotenv from "dotenv";

import app from "./app.js";
import connectDB from "./config/initDb.js";

dotenv.config();

const start = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();