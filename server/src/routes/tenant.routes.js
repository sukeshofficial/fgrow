import express from "express";
import { createTenant } from "../controller/tenant.controller.js";

const router = express.Router();

router.post("/create", createTenant);

export default router;
