/**
 * Authentication reducer and initial state responsible for managing
 * user authentication status, loading states, user data, and errors
 * based on dispatched authentication-related actions.
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

export const initialAuthState = {
  user: null,
  avatar: null,
  username: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        avatar: action.payload?.profile_avatar?.secure_url || null,
        username: action.payload?.username || null,
      };

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
