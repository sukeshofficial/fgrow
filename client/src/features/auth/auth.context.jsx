/**
 * Authentication context provider
 *
 * Manages global authentication state using React Context
 * and useReducer, exposing auth data and actions across
 * the application.
 */

import { createContext, useReducer, useEffect, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";


import {
  authReducer,
  initialAuthState,
} from "./auth.reducer.js";
import { logout as logoutAction, checkAuth as fetchUser } from "./auth.actions.js";

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
   * TanStack Query for session management
   */
  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ["auth-user"],
    queryFn: () => fetchUser(dispatch),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: false, // Don't retry if session is invalid
  });

  // Sync state with query result
  useEffect(() => {
    if (user) {
      dispatch({ type: AUTH_SUCCESS, payload: user });
    }
  }, [user]);


  /**
   * Logout handler
   */
  const logout = async () => await logoutAction(dispatch);

  const authContextValue = useMemo(() => ({
    ...state,
    isLoading: state.loading || isLoading,
    dispatch,
    logout,
    refetchUser: refetch,
  }), [state, isLoading, logout, refetch]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );

};
