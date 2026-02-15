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

/* Routes */
import ProtectedRoute from "./routes/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

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
