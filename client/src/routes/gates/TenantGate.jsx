import { useAuth } from "../../hooks/useAuth";

import WelcomePage from "../../pages/Welcome";
import TenantPendingScreen from "../../components/tenant/TenantPendingScreen";
import JoinAsStaff from "../../components/staff/JoinAsStaff";

import "../../styles/tenant-gate.css";

export const TenantGate = ({ children }) => {
  const { user, tenant, meState, invitation } = useAuth();

  // Super Admin bypass
  if (user?.platform_role === "super_admin") {
    return children;
  }

  const hasTenant = !!user?.tenant_id;
  const verificationStatus = tenant?.verificationStatus;

  let overlay = null;

  if (!hasTenant || meState === "NO_TENANT") {
    return <WelcomePage />;
  }

  else if (meState === "INVITED") {
    overlay = <JoinAsStaff initialToken={invitation?.token} />;
  }

  else if (
    meState === "PENDING_VERIFICATION" ||
    verificationStatus === "pending"
  ) {
    overlay = <TenantPendingScreen />;
  }

  else if (meState === "TENANT_INACTIVE") {
    overlay = (
      <div className="tenant-block-wrapper">
        <div className="tenant-block-card">
          <h2>Tenant inactive</h2>
          <p>Your tenant is inactive. Please contact support.</p>
        </div>
      </div>
    );
  }

  else if (
    meState === "TENANT_MISSING" ||
    meState === "REJECTED_VERIFICATION"
  ) {
    overlay = (
      <div className="tenant-block-wrapper">
        <div className="tenant-block-card">
          <h2>Tenant access unavailable</h2>
          <p>
            Your tenant is not available or was rejected. Please reach out to
            the platform administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {overlay}
    </>
  );
};