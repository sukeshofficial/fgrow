import React, { useState, useMemo, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import SideBar from "../components/SideBar";
import StaffListTable from "../components/tenant/StaffListTable";
import { Button } from "../components/ui/Button";
import { FaUserPlus, FaExclamationCircle, FaBuilding } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import { getTenantById } from "../api/tenant.api";
import "../styles/welcome.css";
import "../styles/tenant-info.css";
import { useDelayedLoading } from "../hooks/useDelayedLoading";
import ScrollingCredits from "../components/dashboard/ScrollingCredits";
import { useModal } from "../context/ModalContext";

// Lazy load heavy components
const InviteUserModal = lazy(() => import("../components/tenant/InviteUserModal"));
const DashboardSkeleton = lazy(() => import("../components/skeletons/DashboardSkeleton"));


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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const queryClient = useQueryClient();


  const { openReportModal } = useModal();

  /**
   * Fetch tenant details using TanStack Query
   */
  const { data: tenantDetails, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant-details", user?.tenant_id],
    queryFn: async () => {
      const response = await getTenantById(user.tenant_id);
      return response.data.data;
    },
    enabled: !!user?.tenant_id,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const showLoading = useDelayedLoading(tenantLoading, 300);


  const handleInviteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["tenant-staff"] });
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
          <Suspense fallback={<div className="skeleton-fallback" />}>
            <DashboardSkeleton />
          </Suspense>
        ) : tenantDetails && (
          <div className="tenant-info-card">
            {tenantDetails.logoUrl ? (
              <img
                src={tenantDetails.logoUrl}
                alt="Logo"
                className="tenant-info-logo"
                loading="lazy"
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
          <StaffListTable />
        )}


        {isInviteModalOpen && (
          <Suspense fallback={null}>
            <InviteUserModal
              onClose={() => setIsInviteModalOpen(false)}
              onSuccess={handleInviteSuccess}
            />
          </Suspense>
        )}

      </div>
    </>
  );
};

export default Dashboard;
