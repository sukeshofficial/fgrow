import React, { createContext, useContext, useState } from "react";
import ErrorPage from "../pages/ErrorPage";

const ErrorContext = createContext();

/**
 * ErrorProvider
 *
 * Provides a global state for catching fatal application errors
 * that aren't caught by the React ErrorBoundary (e.g., Axios failures).
 */
export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  if (error) {
    return (
      <ErrorPage 
        type={error.type} 
        message={error.message} 
        onRetry={clearError}
      />
    );
  }

  return (
    <ErrorContext.Provider value={{ setError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};
