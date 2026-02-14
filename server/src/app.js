import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/v0/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
