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
import "./styles/sidebar.css";

/* Pages */
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";

/* Routing */
import ProtectedRoute from "./routes/ProtectedRoute";
import SuperAdminRoute from "./routes/SuperAdminRoute";
import TenantRoutes from "./routes/TenantRoute";
import StaffRoutes from "./routes/StaffRoute";

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

      {/* Default */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ---------------- ADMIN PORTAL ---------------- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<SuperAdminRoute />}>

          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/tenants" element={<Tasks />} />

        </Route>
      </Route>


      {/* ---------------- TENANT APP ---------------- */}
      <Route element={<ProtectedRoute />}>

        <Route element={<TenantRoutes />}>

          <Route element={<StaffRoutes />}>

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/todo" element={<Tasks />} />
            <Route path="/clients" element={<Tasks />} />
            <Route path="/services" element={<Tasks />} />
            <Route path="/finance" element={<Tasks />} />
            <Route path="/documents" element={<Tasks />} />
            <Route path="/reports" element={<Tasks />} />
            <Route path="/users" element={<Tasks />} />
            <Route path="/notifications" element={<Tasks />} />
            <Route path="/settings" element={<Tasks />} />

          </Route>

        </Route>

      </Route>

    </Routes>
  );
};

export default App;
