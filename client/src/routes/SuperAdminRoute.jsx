import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const SuperAdminRoute = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Only allow super admins to proceed
  if (user.platform_role === "super_admin") {
    return <Outlet />;
  }

  // Redirect non-platform-admins to their tenant dashboard
  return <Navigate to="/dashboard" replace />;
};

export default SuperAdminRoute;