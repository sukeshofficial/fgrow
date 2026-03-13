import mongoose from "mongoose";
import QuotationCounter from "../models/quotation/schemas/quotationCounter.model.js"; // adjust path if needed

const { Types } = mongoose;

function getFinancialYearStart(date = new Date()) {
  // Financial year: Apr 1 to Mar 31
  const y = date.getFullYear();
  const month = date.getMonth(); // 0-based
  // If month >= April (3), FY starts this calendar year, else FY started previous calendar year
  return month >= 3 ? y : y - 1;
}

function formatFyShort(startYear) {
  // startYear e.g. 2025 -> "25-26"
  const a = (startYear % 100).toString().padStart(2, "0");
  const b = ((startYear + 1) % 100).toString().padStart(2, "0");
  return `${a}-${b}`;
}

/**
 * Simple generator (atomic via findOneAndUpdate upsert):
 * returns "QUO/25-26/001"
 */
export const generateQuotationNumber = async (tenant_id, opts = {}) => {
  if (!tenant_id) throw new Error("tenant_id required to generate quotation number");

  const now = opts.date ? new Date(opts.date) : new Date();
  const fyStart = getFinancialYearStart(now); // numeric year e.g. 2025

  // atomic counter increment per tenant + financial year (stored in 'year' field)
  const counter = await QuotationCounter.findOneAndUpdate(
    { tenant_id: new Types.ObjectId(tenant_id), year: fyStart },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seq = (counter.seq || 0).toString().padStart(3, "0"); // 3 digits (001)
  const fyShort = formatFyShort(fyStart);

  // You asked for QUO/25-26/001
  return `QUO/${fyShort}/${seq}`;
};