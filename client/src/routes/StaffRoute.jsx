import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import InvitationGate from "./gates/InvitationGate";

const StaffRoutes = () => {
  const { user } = useAuth();

  if (!user) return null;

  // tenant_role expected: "staff"
  if (user.tenant_role === "staff") {
    return <InvitationGate><Outlet /></InvitationGate>;
  }

  return <Outlet />;
};

export default StaffRoutes;