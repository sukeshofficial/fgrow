import React, { useEffect, useState } from "react";
import { getTenantStaff } from "../../api/tenant.api";
import { Card } from "../ui/Card";
import "../../styles/welcome.css";
import { Spinner } from "../ui/Spinner";
import TableSkeleton from "../skeletons/TableSkeleton";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";

const StaffListTable = ({ refreshKey }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const showLoading = useDelayedLoading(loading, 300);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await getTenantStaff();
        setStaff(response.data.data);
      } catch (err) {
        setError("Failed to load staff list.");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [refreshKey]);
  if (showLoading) {
    return (
      <Card className="staff-list-card">
        <h3 className="staff-title">Joined Members</h3>
        <div style={{ padding: '20px' }}>
          <TableSkeleton rows={3} columns={5} />
        </div>
      </Card>
    );
  }
  if (error) return <div className="staff-error">{error}</div>;

  return (
    <Card className="staff-list-card">
      <h3 className="staff-title">Joined Members</h3>
      <div className="staff-table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined At</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member._id}>
                <td>
                  <div className="staff-member-cell">
                    {member.profile_avatar?.secure_url ? (
                      <img
                        src={member.profile_avatar.secure_url}
                        alt={member.name}
                        className="staff-avatar"
                      />
                    ) : (
                      <div className="staff-avatar-placeholder">
                        {(member.name || member.username || "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="staff-info">
                      <span className="staff-name">{member.name || "N/A"}</span>
                      <span className="staff-username">@{member.username}</span>
                    </div>
                  </div>
                </td>
                <td>{member.email}</td>
                <td>
                  <span className={`staff-role-badge role-${member.tenant_role}`}>
                    {member.tenant_role}
                  </span>
                </td>
                <td>
                  <span className={`staff-status-pill status-${member.status}`}>
                    {member.status}
                  </span>
                </td>
                <td>{new Date(member.joined_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default React.memo(StaffListTable);
