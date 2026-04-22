// ---------- Helper: create 6-digit OTP ----------
import { User } from "../models/auth/user.model.js";

export const createNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit string
};

export const generateUsername = async (email) => {
  // Base username from email
  let baseUsername = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, ""); // keep only safe chars

  let username = baseUsername;
  let counter = 1;

  // Check if username exists
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter++}`;
  }

  return username;
};

export const generateMeetingCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Format: ABCD-1234
  return `${code.slice(0, 4)}-${code.slice(4)}`;
};

export const validatePAN = (pan) => {
  if (!pan) return false;
  // PAN: 5 letters, 4 digits, 1 letter (10 chars)
  const re = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
  return re.test(pan.trim());
};

export const validateGSTIN = (gst) => {
  if (!gst) return true;
  const gstClean = gst.trim().toUpperCase();

  // Basic format check: 15 characters, standard regex
  const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
  return re.test(gstClean);

  /**
   * NOTE: Robust checksum validation (MOD 36) can be added here, 
   * but is currently disabled to avoid blocking valid edge-case GSTINs.
   * Total verification is handled by the external GSTIN API.
   */
};