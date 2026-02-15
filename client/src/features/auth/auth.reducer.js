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
} from "./auth.types";

export const initialAuthState = {
  user: null,
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
        error: action.payload,
      };

    case LOGOUT:
      return {
        ...initialAuthState,
        isLoading: false,
      };

    default:
      return state;
  }
};
