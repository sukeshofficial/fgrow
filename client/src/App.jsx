import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

/* Global styles */
import "./App.css";
import "./styles/spinner.css";
import "./styles/auth.css";
import "./styles/dashboard.css";
import "./styles/avatar-upload.css";
import "./styles/otp-modal.css";
import "./styles/password-meter.css";

/* Pages */
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";

/* Routing */
import ProtectedRoute from "./routes/ProtectedRoute";

/* Auth */
import { useAuth } from "./hooks/useAuth";
import { checkAuth } from "./features/auth/auth.actions";

/**
 * App
 *
 * Root application component responsible for
 * initializing auth state and defining routes.
 */
const App = () => {
  /**
   * Auth dispatch
   */
  const { dispatch } = useAuth();

  /**
   * Check authenticated session on app mount
   */
  useEffect(() => {
    checkAuth(dispatch);
  }, [dispatch]);

  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
