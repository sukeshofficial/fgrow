import mongoose from "mongoose";
import ExpenseCounter from "../models/expense/schemas/expenseCounter.model.js";

const { Types } = mongoose;

function getFinancialYearStart(date = new Date()) {
  // Financial year: Apr 1 to Mar 31
  const y = date.getFullYear();
  const month = date.getMonth(); // 0-based
  // If month >= April (3), FY starts that year, else starts previous year
  return month >= 3 ? y : y - 1;
}

function formatFyShort(startYear) {
  const a = (startYear % 100).toString().padStart(2, "0");
  const b = ((startYear + 1) % 100).toString().padStart(2, "0");
  return `${a}-${b}`;
}

/**
 * generateExpenseNumber(tenant_id, opts = { date })
 * returns string like "EXP/25-26/001"
 */
export async function generateExpenseNumber(tenant_id, opts = {}) {
  if (!tenant_id) throw new Error("tenant_id required");

  const now = opts.date ? new Date(opts.date) : new Date();
  const fyStart = getFinancialYearStart(now);

  const counter = await ExpenseCounter.findOneAndUpdate(
    { tenant_id: new Types.ObjectId(tenant_id), year: fyStart },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  const seq = (counter.seq || 0).toString().padStart(3, "0");
  const fyShort = formatFyShort(fyStart);

  return `EXP/${fyShort}/${seq}`;
}
