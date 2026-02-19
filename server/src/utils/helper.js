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
