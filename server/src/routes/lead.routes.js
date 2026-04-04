import express from "express";
import { createLead } from "../controllers/lead.controller.js";

const router = express.Router();

router.post("/", createLead);

export default router;
