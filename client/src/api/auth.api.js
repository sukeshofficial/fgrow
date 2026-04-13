import { api } from "./api.js";

/**
 * Register User
 * POST http://localhost:5000/api/v0/auth/register
 * Content-Type: multipart/form-data
 */
export const registerUser = (formData) => {
  return api.post("/auth/register", formData);
};

/**
 * Verify Signup OTP
 * POST http://localhost:5000/api/v0/auth/verify-signup-otp
 */
export const verifySignupOtp = ({ email, otp }) => {
  return api.post("/auth/verify-signup-otp", {
    email,
    otp,
  });
};

/**
 * Resend Verification OTP
 * POST http://localhost:5000/api/v0/auth/resend-verify-otp
 */
export const resendVerifyOtp = (email) => {
  return api.post("/auth/resend-verify-otp", {
    email,
  });
};

/**
 * Login User
 * POST http://localhost:5000/api/v0/auth/login
 */
export const loginUser = ({ email, password }) => {
  return api.post("/auth/login", {
    email,
    password,
  });
};

/**
 * Logout User
 * GET http://localhost:5000/api/v0/auth/logout
 */
export const logoutUser = () => {
  return api.post("/auth/logout");
};

/**
 * userPreview
 * GET http://localhost:5000/api/v0/auth/user-preview?email=...
 */
export const userPreview = (email) => {
  return api.get("/auth/user-preview", {
    params: { email },
  });
};

/**
 * getMe
 * GET http://localhost:5000/api/v0/auth/me
 */
export const getMe = () => {
  return api.get("/auth/me");
};

/**
 * Forgot Password Request
 * POST /auth/forgot-password
 */
export const forgotPasswordRequest = (email) => {
  return api.post("/auth/forgot-password", { email });
};

/**
 * Reset Password
 * POST /auth/reset-password
 */
export const resetPassword = (data) => {
  return api.post("/auth/reset-password", data);
};

/**
 * Verify Reset OTP
 * POST /auth/verify-reset-otp
 */
export const verifyResetOtp = (data) => {
  return api.post("/auth/verify-reset-otp", data);
};


