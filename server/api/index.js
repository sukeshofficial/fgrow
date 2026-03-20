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

// ─── DB connection (cached across hot reloads) ────────────────────────────
async function connectIfNeeded() {
  // Already connected — reuse
  if (mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI environment variable is not set");

  await mongoose.connect(uri, { autoIndex: false });
  console.log("✅ MongoDB connected:", mongoose.connection.host);
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
