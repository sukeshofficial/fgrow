// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

// Create a reusable DB connection function
const connectDB = async () => {
  try {
    // Validate required environment variable
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are default in modern mongoose
      // but keeping for clarity & future-proofing
      autoIndex: false, // Disable auto index in production
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);

    // Exit process if DB fails (important in production)
    process.exit(1);
  }
};

// Gracefully handle app termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🛑 MongoDB connection closed due to app termination");
  process.exit(0);
});

// Nice to have: Add retry mechanism for DB connection
// Nice to have: Add connection monitoring logs (connected/disconnected events)
// Nice to have: Use a proper logging library instead of console.log

export default connectDB;
