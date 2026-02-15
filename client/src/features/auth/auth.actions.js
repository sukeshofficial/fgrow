import {
  registerUser,
  verifySignupOtp,
  resendVerifyOtp,
  loginUser,
  logoutUser,
  getMe,
} from "../../api/auth.api.js";

import { AUTH_START, AUTH_SUCCESS, AUTH_FAIL, LOGOUT } from "./auth.types.js";

/**
 * Register User
 */
export const register = async (dispatch, formData) => {
  dispatch({ type: AUTH_START });

  try {
    const res = await registerUser(formData);
    dispatch({ type: AUTH_SUCCESS, payload: res.data.user || null });
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Register failed";
    dispatch({
      type: AUTH_FAIL,
      payload: message,
    });
    throw err;
  }
};

/**
 * Verify Signup OTP
 */
export const verifyOtp = async (dispatch, payload) => {
  dispatch({ type: AUTH_START });

  try {
    const res = await verifySignupOtp(payload);

    dispatch({
      type: AUTH_SUCCESS,
      payload: res.data.user,
    });

    return res.data;
  } catch (err) {
    dispatch({
      type: AUTH_FAIL,
      payload: err.response?.data?.message || "OTP verification failed",
    });
    throw err;
  }
};

/**
 * Resend OTP
 */
export const resendOtp = async (dispatch, email) => {
  try {
    const res = await resendVerifyOtp(email);
    return res.data;
  } catch (err) {
    throw err;
  }
};

/**
 * Login User
 */
export const login = async (dispatch, payload) => {
  dispatch({ type: AUTH_START });

  try {
    const res = await loginUser(payload);

    dispatch({
      type: AUTH_SUCCESS,
      payload: res.data.user,
    });

    return res.data;
  } catch (err) {
    dispatch({
      type: AUTH_FAIL,
      payload: err.response?.data?.message || "Login failed",
    });
    throw err;
  }
};

/**
 * Logout User
 */
export const logout = async (dispatch) => {
  try {
    await logoutUser();
  } finally {
    dispatch({ type: LOGOUT });
  }
};

/**
 * Check Auth
 */
export const checkAuth = async (dispatch) => {
  dispatch({ type: AUTH_START });

  try {
    const res = await getMe();
    dispatch({
      type: AUTH_SUCCESS,
      payload: res.data.user,
    });
    return res.data;
  } catch (err) {
    dispatch({
      type: AUTH_FAIL,
      payload: null,
    });
    return null;
  }
};
