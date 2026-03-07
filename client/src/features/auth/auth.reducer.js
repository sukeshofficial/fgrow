/**
 * Authentication reducer and initial state
 *
 * Manages authentication lifecycle, user data,
 * loading states, and error handling.
 */

import {
  AUTH_START,
  AUTH_SUCCESS,
  AUTH_FAIL,
  SET_USER,
  LOGOUT,
  SET_AVATAR,
  SET_PROFILE_PREVIEW,
} from "./auth.types";

/**
 * Initial authentication state
 */
export const initialAuthState = {
  user: null,
  tenant: null,
  invitation: null,
  meState: null,
  avatar: null,
  username: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

/**
 * Auth reducer
 */
export const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_SUCCESS:
      // Support both legacy payloads (user only) and full /auth/me payload
      // - Login/register/verifyOtp pass a user object directly
      // - checkAuth passes the full response: { state, user, tenant, invitation, ... }
      {
        const payload = action.payload || null;
        const resolvedUser = payload && payload.user ? payload.user : payload;

        return {
          ...state,
          isLoading: false,
          isAuthenticated: true,
          user: resolvedUser,
          tenant: payload && payload.tenant ? payload.tenant : state.tenant,
          invitation:
            payload && payload.invitation ? payload.invitation : state.invitation,
          meState: payload && payload.state ? payload.state : state.meState,
          avatar:
            resolvedUser?.profile_avatar?.secure_url || null,
          username: resolvedUser?.username || null,
        };
      }

    case SET_USER:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
      };

    case AUTH_FAIL:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        avatar: null,
        error: action.payload,
      };

    case LOGOUT:
      return {
        ...initialAuthState,
        isLoading: false,
      };

    case SET_AVATAR:
      return {
        ...state,
        avatar: action.payload.profile_avatar.secure_url,
      };

    case SET_PROFILE_PREVIEW:
      return {
        ...state,
        avatar: action.payload.avatar,
        username: action.payload.username,
      };

    default:
      return state;
  }
};
