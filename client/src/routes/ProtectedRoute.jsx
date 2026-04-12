import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { Spinner } from "../components/ui/Spinner.jsx";
import NotificationDropdown from "../components/Notification/NotificationDropdown.jsx";


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <NotificationDropdown />
      <Outlet />
    </>
  );

};

export default ProtectedRoute;
