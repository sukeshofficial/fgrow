/**
 * useAuth
 *
 * Custom hook for accessing authentication state and actions.
 * Ensures usage within the AuthProvider boundary.
 */

import { useContext } from "react";
import { AuthContext } from "../features/auth/auth.context.jsx";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
