/**
 * Vercel Serverless Entry Point
 *
 * Wraps the Express app as a serverless function.
 * Connects to MongoDB once per cold-start and reuses the connection.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "../src/app.js";

dotenv.config();

// Disable buffering so we get immediate errors if connection fails
mongoose.set("bufferCommands", false);

async function connectIfNeeded() {
  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) return;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI environment variable is not set");

  console.log("⏳ Connecting to MongoDB...");
  await mongoose.connect(uri, {
    autoIndex: false,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  });
  console.log("✅ MongoDB connected successfully");
}

// ─── Handler ──────────────────────────────────────────────────────────────
const handler = async (req, res) => {
  try {
    await connectIfNeeded();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    // Return a plain 503 — Express hasn't run yet so we set headers manually
    const origin = req.headers.origin || "";
    const allowed = (process.env.FRONTEND_URL || "").split(",").map((s) => s.trim());
    if (allowed.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Content-Type", "application/json");
    return res.status(503).json({ message: "Service temporarily unavailable" });
  }

  return app(req, res);
};

export default handler;
