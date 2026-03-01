import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/v0/auth", authRoutes);
app.use("/api/v0/tenant", tenantRoutes);
app.use("/api/v0/invitation", invitationRoutes);

app.get("/api/v0/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
