import express from "express";

import {
  createExpenseController,
  listExpensesController,
  getExpenseController,
  updateExpenseController,
  deleteExpenseController,
  uploadExpenseFilesController,
  deleteExpenseFileController,
  attachInvoiceController,
  exportExpensesController,
  createExpenseCategoryController,
  listExpenseCategoriesController,
  updateExpenseCategoryController,
  deleteExpenseCategoryController,
  createPaymentModeController,
  listPaymentModesController,
  updatePaymentModeController,
  deletePaymentModeController,
  getNextExpenseNumberController,
  resetExpenseCounterController,
} from "../controller/expense.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

import { requireRole } from "../middleware/tenant_role.middleware.js";
import { uploadFiles } from "../middleware/upload.middleware.js";

const router = express.Router();

const authStaff = [authMiddleware, requireRole("owner", "staff")];

// Expenses
router.post("/", ...authStaff, createExpenseController);
router.get("/", ...authStaff, listExpensesController);

// Categories
router.get("/categories", ...authStaff, listExpenseCategoriesController);

// Payment Mode
router.get("/payment-modes", ...authStaff, listPaymentModesController);

// Expenses
router.get("/:id", ...authStaff, getExpenseController);
router.patch("/:id", ...authStaff, updateExpenseController);
router.delete("/:id", ...authStaff, deleteExpenseController);

// Expense Files
router.post("/:id/files", ...authStaff, uploadFiles.array("files"), uploadExpenseFilesController);
router.delete("/:id/files", ...authStaff, deleteExpenseFileController);
router.post("/:id/attach-invoice", ...authStaff, attachInvoiceController);

// Export
router.post("/export", ...authStaff, exportExpensesController);

// Categories
router.post("/categories", ...authStaff, createExpenseCategoryController);
router.patch("/categories/:id", ...authStaff, updateExpenseCategoryController);
router.delete("/categories/:id", ...authStaff, deleteExpenseCategoryController);

// Payment Mode
router.post("/payment-modes", ...authStaff, createPaymentModeController);
router.patch("/payment-modes/:id", ...authStaff, updatePaymentModeController);
router.delete("/payment-modes/:id", ...authStaff, deletePaymentModeController);
router.get("/next-number", authStaff, getNextExpenseNumberController);
router.post("/reset-counter", authStaff, resetExpenseCounterController);

export default router;
