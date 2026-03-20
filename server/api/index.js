/**
 * Vercel Serverless Entry Point
 *
 * This file wraps the Express app as a serverless function.
 * Vercel calls this instead of starting a long-running HTTP server.
 */

import dotenv from "dotenv";
import connectDB from "../src/config/initDb.js";
import app from "../src/app.js";

dotenv.config();

// Connect to MongoDB once per cold-start.
// Subsequent invocations reuse the cached connection.
let isConnected = false;

const handler = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
};

export default handler;
