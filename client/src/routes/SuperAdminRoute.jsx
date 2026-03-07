import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const SuperAdminRoute = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Super admin dashboard
  if (user.platform_role === "super_admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export default SuperAdminRoute;