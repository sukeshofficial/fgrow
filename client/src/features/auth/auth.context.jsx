/**
 * Authentication context provider
 *
 * Manages global authentication state using React Context
 * and useReducer, exposing auth data and actions across
 * the application.
 */

import { createContext, useReducer } from "react";

import {
  authReducer,
  initialAuthState,
} from "./auth.reducer.js";
import { logout as logoutAction } from "./auth.actions.js";
import {
  AUTH_START,
  AUTH_SUCCESS,
  AUTH_FAIL,
  LOGOUT,
  SET_USER,
  SET_AVATAR,
} from "./auth.types.js";

/**
 * Auth context
 */
export const AuthContext = createContext(null);

/**
 * AuthProvider
 */
export const AuthProvider = ({ children }) => {
  /**
   * Auth state and dispatcher
   */
  const [state, dispatch] = useReducer(
    authReducer,
    initialAuthState,
  );

  /**
   * Action helpers
   * (kept for internal usage or future extension)
   */
  const authStart = () => dispatch({ type: AUTH_START });
  const authSuccess = (user) => dispatch({ type: AUTH_SUCCESS, payload: user });
  const authFail = (error) => dispatch({ type: AUTH_FAIL, payload: error });
  const setUser = (user) => dispatch({ type: SET_USER, payload: user });
  const setAvatar = (avatar) => dispatch({ type: SET_AVATAR, payload: avatar });

  /**
   * Logout handler
   */
  const logout = async () => await logoutAction(dispatch);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        dispatch,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
