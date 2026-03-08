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
 * Register a new user
 */
export const register = async (dispatch, formData) => {
  dispatch({ type: AUTH_START });

  try {
    const res = await registerUser(formData);

    dispatch({
      type: AUTH_SUCCESS,
      payload: res.data,
    });

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
 * Verify signup OTP
 */
export const verifyOtp = async (dispatch, payload) => {
  dispatch({ type: AUTH_START });

  try {
    await verifySignupOtp(payload); // API sets the cookie

    // Fetch full hydrated state (tenant info, meState, etc)
    const fullState = await checkAuth(dispatch);
    return fullState;
  } catch (err) {
    dispatch({
      type: AUTH_FAIL,
      payload: err.response?.data?.message || "OTP verification failed",
    });

    throw err;
  }
};

/**
 * Resend signup OTP
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
 * Login user
 */
export const login = async (dispatch, payload) => {
  dispatch({ type: AUTH_START });

  try {
    await loginUser(payload); // API sets the cookie

    // Fetch full hydrated state (tenant info, meState, etc)
    const fullState = await checkAuth(dispatch);
    return fullState;
  } catch (err) {
    dispatch({
      type: AUTH_FAIL,
      payload: err.response?.data?.message || "Login failed",
    });

    throw err;
  }
};

/**
 * Logout user
 */
export const logout = async (dispatch) => {
  try {
    await logoutUser();
  } finally {
    dispatch({ type: LOGOUT });
  }
};

/**
 * Check authenticated user session
 */
export const checkAuth = async (dispatch) => {
  dispatch({ type: AUTH_START });

  try {
    const res = await getMe();

    dispatch({
      type: AUTH_SUCCESS,
      payload: res.data, // to get the state.
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
