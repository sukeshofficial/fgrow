/**
 * Authentication context provider responsible for managing and exposing
 * global authentication state and actions using React Context API and useReducer.
 * This provider allows any component in the application to access auth data
 * and trigger authentication-related state changes.
 */

import { createContext, useReducer } from "react";
import { authReducer, initialAuthState } from "./auth.reducer.js";
import {
  AUTH_START,
  AUTH_SUCCESS,
  AUTH_FAIL,
  LOGOUT,
  SET_USER,
  SET_AVATAR,
} from "./auth.types.js";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const authStart = () => dispatch({ type: AUTH_START });
  const authSuccess = (user) => dispatch({ type: AUTH_SUCCESS, payload: user });
  const setUser = (user) => dispatch({ type: SET_USER, payload: user });
  const authFail = (error) => dispatch({ type: AUTH_FAIL, payload: error });
  const setAvatar = (user) => dispatch({ type: SET_AVATAR, payload: user });
  const logout = () => dispatch({ type: LOGOUT });

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
