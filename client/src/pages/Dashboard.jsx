import { useState } from "react";
import Navbar from "../components/NavBar";
import SideBar from "../components/SideBar";
import StaffListTable from "../components/tenant/StaffListTable";
import InviteUserModal from "../components/tenant/InviteUserModal";
import { Button } from "../components/ui/Button";
import { FaUserPlus } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import "../styles/welcome.css";

/**
 * Dashboard page
 *
 * Main authenticated landing page.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleInviteSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      {/* <Navbar /> */}
      <SideBar />
      <div className="dashboard">
        <div className="dashboard-header-row">
          <h1 className="dashboard-title">Dashboard</h1>
          {user?.tenant_role === "owner" && (
            <Button
              variant="primary"
              onClick={() => setIsInviteModalOpen(true)}
              className="invite-staff-btn"
            >
              <FaUserPlus style={{ marginRight: "8px" }} />
              Invite Member
            </Button>
          )}
        </div>

        {user?.tenant_role === "owner" && (
          <StaffListTable refreshKey={refreshKey} />
        )}

        <InviteUserModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onInviteSuccess={handleInviteSuccess}
        />
      </div>
    </>
  );
};

export default Dashboard;
