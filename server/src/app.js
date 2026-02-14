import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import meetRoutes from "./routes/meet.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/v0/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/api/v0/auth", authRoutes);
app.use("/api/v0/meet", meetRoutes);

export default app;
