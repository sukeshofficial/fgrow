import express from "express";
import {
    createDocumentController,
    listDocumentsController,
    getDocumentController,
    updateDocumentController,
    deleteDocumentController,
    returnDocumentController,
    exportDocumentsController
} from "../controller/document.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/tenant_role.middleware.js";

const router = express.Router();

const authStaff = [authMiddleware, requireRole("owner", "staff")];
const authOwner = [authMiddleware, requireRole("owner")];


router.post("/", ...authStaff, createDocumentController);
router.get("/", ...authStaff, listDocumentsController);
router.get("/export", ...authStaff, exportDocumentsController);
router.get("/:id", ...authStaff, getDocumentController);
router.patch("/:id", ...authStaff, updateDocumentController);
router.delete("/:id", ...authStaff, deleteDocumentController);
router.post("/:id/return", ...authStaff, returnDocumentController);

export default router;
