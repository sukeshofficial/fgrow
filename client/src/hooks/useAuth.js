/**
 * Custom authentication hook that provides access to the AuthContext
 * and enforces usage within the AuthProvider to prevent invalid context access.
 */
import { useContext } from "react";
import { AuthContext } from "../features/auth/auth.context.jsx";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
