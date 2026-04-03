import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import { TenantGate } from "./gates/TenantGate";
import WelcomePage from "../pages/Welcome";

const TenantRoutes = () => {
  const { user } = useAuth();

  if (!user) return null;

  // tenant_role expected: "owner"
  if (user.tenant_role === "owner") {
    return <TenantGate><Outlet /></TenantGate>;
  }

  // Handle removed / dissociated members
  if (user.tenant_role === "none" || !user.tenant_id) {
    return <WelcomePage />;
  }

  return <Outlet />;
};

export default TenantRoutes;