import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';

import authRoutes from "./routes/auth.routes.js";


const app = express();

app.use(express.json());
app.use(cookieParser());  
app.use(cors());

app.get("/api/v0/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/api/v0/auth", authRoutes);

export default app;
