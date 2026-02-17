/**
 * MongoDB connection setup
 *
 * Handles database connection, environment validation,
 * and graceful shutdown for production environments.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

/**
 * Load environment variables
 */
dotenv.config();

/**
 * Establish MongoDB connection
 */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(
      process.env.MONGO_URI,
      {
        autoIndex: false, // Disable auto-indexing in production
      },
    );

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);

    process.exit(1);
  }
};

/**
 * Graceful shutdown on process termination
 */
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log(
    "🛑 MongoDB connection closed due to app termination",
  );
  process.exit(0);
});

export default connectDB;
