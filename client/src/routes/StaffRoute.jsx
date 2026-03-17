import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import InvitationGate from "./gates/InvitationGate";
import WelcomePage from "../pages/Welcome";

const StaffRoutes = () => {
  const { user, meState } = useAuth();

  if (!user) return null;

  // tenant_role expected: "staff"
  if (user.tenant_role === "staff") {
    if (meState === "NO_TENANT") {
      return <WelcomePage />;
    }
    return <InvitationGate><Outlet /></InvitationGate>;
  }

  return <Outlet />;
};

export default StaffRoutes;