import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import { TenantGate } from "./gates/TenantGate";

const TenantRoutes = () => {
  const { user } = useAuth();

  if (!user) return null;

  // tenant_role expected: "owner"
  if (user.tenant_role === "owner") {
    return <TenantGate><Outlet /></TenantGate>;
  }

  return <Outlet />;
};

export default TenantRoutes;