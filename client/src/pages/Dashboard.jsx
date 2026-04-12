import { useState, useEffect } from "react";
import SideBar from "../components/SideBar";
import StaffListTable from "../components/tenant/StaffListTable";
import InviteUserModal from "../components/tenant/InviteUserModal";
import { Button } from "../components/ui/Button";
import { FaUserPlus, FaExclamationCircle, FaBuilding } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import { getTenantById } from "../api/tenant.api";
import "../styles/welcome.css";
import "../styles/tenant-info.css";
import { Spinner } from "../components/ui/Spinner";
import DashboardSkeleton from "../components/skeletons/DashboardSkeleton";
import { useDelayedLoading } from "../hooks/useDelayedLoading";
import ScrollingCredits from "../components/dashboard/ScrollingCredits";
import { useModal } from "../context/ModalContext";
import logger from "../utils/logger.js";

/**
 * Dashboard page
 *
 * Main authenticated landing page.
 */
const getAvatarColorClass = (name) => {
  const classes = [
    'bg-indigo',
    'bg-deep-blue',
    'bg-violet',
    'bg-blue',
    'bg-cyan',
    'bg-emerald',
  ];
  if (!name) return classes[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return classes[Math.abs(hash) % classes.length];
};

const Dashboard = () => {
  const { user } = useAuth();
  const [tenantDetails, setTenantDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { openReportModal } = useModal();
  const showLoading = useDelayedLoading(loading, 300);

  useEffect(() => {
    const fetchTenantData = async () => {
      if (user?.tenant_id) {
        try {
          setLoading(true);
          const response = await getTenantById(user.tenant_id);
          setTenantDetails(response.data.data);
        } catch (err) {
          logger.error("Dashboard", "Failed to fetch tenant details", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchTenantData();
  }, [user?.tenant_id]);

  const handleInviteSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      {/* <Navbar /> */}
      <SideBar />
      <div className="dashboard">
        <ScrollingCredits />
        <div className="dashboard-notice-box">
          <div className="notice-icon">
            <FaExclamationCircle />
          </div>
          <div className="notice-content">
            <p>
              This is a <strong>test version</strong> of the FGrow application.
              {" "}If you encounter any bugs, please report them to{" "}
              <a
                href="#report"
                onClick={(e) => {
                  e.preventDefault();
                  openReportModal();
                }}
                className="feedback-link"
              >
                feedback@forgegrid.in
              </a>
            </p>
            <p className="notice-subtext" style={{ marginTop: '8px' }}>
              <strong>Note: No data is stored permanently right now.</strong>
            </p>
          </div>
        </div>

        <div className="dashboard-header-row">
          <h1 className="dashboard-title">Dashboard</h1>
          {user?.tenant_role === "owner" && (
            <Button
              variant="primary"
              onClick={() => setIsInviteModalOpen(true)}
              className="invite-staff-btn"
            >
              <FaUserPlus />
              <span className="invite-staff-text">Invite Member</span>
            </Button>
          )}
        </div>

        {/* Tenant Info Section */}
        {showLoading ? (
          <DashboardSkeleton />
        ) : tenantDetails && (
          <div className="tenant-info-card">
            {tenantDetails.logoUrl ? (
              <img
                src={tenantDetails.logoUrl}
                alt="Logo"
                className="tenant-info-logo"
              />
            ) : (
              <div className="tenant-info-placeholder">
                <FaBuilding size={32} />
              </div>
            )}

            <div className="tenant-info-content">
              <h2 className="tenant-info-name">{tenantDetails.name}</h2>
              <p className="tenant-info-details">
                {tenantDetails.companyEmail} • {tenantDetails.companyPhone || 'No Phone'}
              </p>
              <div className="tenant-info-badge-container">
                <span className={`tenant-info-badge ${tenantDetails.verificationStatus}`}>
                  {tenantDetails.verificationStatus}
                </span>
              </div>
            </div>
          </div>
        )}

        {user?.tenant_role === "owner" && (
          <StaffListTable refreshKey={refreshKey} />
        )}

        {isInviteModalOpen && (
          <InviteUserModal
            onClose={() => setIsInviteModalOpen(false)}
            onSuccess={handleInviteSuccess}
          />
        )}
      </div>
    </>
  );
};

export default Dashboard;
