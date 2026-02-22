// ---------- Helper: create 6-digit OTP ----------
import { User } from "../models/user.model.js";

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
