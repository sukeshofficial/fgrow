import React, { useState, useEffect } from "react";
import { getAllUsersAdmin, deleteUserAdmin, forceLogoutUserAdmin } from "../../api/superadmin.api";
import { Button } from "../../components/ui/Button";
import { FaTrash, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import ConfirmModal from "../../components/ui/ConfirmModal";
import TableSkeleton from "../../components/skeletons/TableSkeleton";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";

const SuperAdminUsersList = () => {
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useDelayedLoading(loading, 300);
  const [error, setError] = useState("");
  
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [confirmLogoutUser, setConfirmLogoutUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsersAdmin();
      setGroupedUsers(response.data.data);
    } catch (err) {
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteUser) return;
    try {
      setSubmitting(true);
      await deleteUserAdmin(confirmDeleteUser._id);
      setConfirmDeleteUser(null);
      fetchUsers();
    } catch (err) {
      alert("Deletion failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (!confirmLogoutUser) return;
    try {
      setSubmitting(true);
      await forceLogoutUserAdmin(confirmLogoutUser._id);
      setConfirmLogoutUser(null);
      alert("User has been forcefully logged out");
    } catch (err) {
      alert("Logout failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (showLoading) {
    return (
      <div style={{ padding: "20px" }}>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  if (error) {
    return <div className="staff-error">{error}</div>;
  }

  if (groupedUsers.length === 0) {
    return <div className="staff-loading">No users found on the platform.</div>;
  }

  return (
    <>
      {groupedUsers.map((group) => (
        <div key={group.tenantName} className="staff-list-card no-margin" style={{ marginBottom: "24px" }}>
          <div className="card-header" style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
            {group.tenantData?.logoUrl ? (
              <img src={group.tenantData.logoUrl} alt="logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
            ) : (
              <FaUserCircle size={28} style={{ color: "var(--text-muted)" }} />
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-main)" }}>{group.tenantName}</h3>
              {group.tenantData && (
                <span className={`staff-role-badge ${group.tenantData.verificationStatus}`} style={{ marginTop: "4px", display: "inline-block" }}>
                  {group.tenantData.verificationStatus}
                </span>
              )}
            </div>
          </div>
          
          <div className="staff-table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>System Profile</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {group.users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="staff-member-cell">
                        <div className="staff-avatar-placeholder avatar-bg" style={{ overflow: 'hidden', padding: 0, border: 'none', background: 'transparent' }}>
                          {user.profile_avatar?.secure_url ? (
                            <img src={user.profile_avatar.secure_url} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <FaUserCircle size={32} style={{ color: "var(--text-muted)" }} />
                          )}
                        </div>
                        <div className="staff-info">
                          <span className="staff-name">{user.name || "Unknown"}</span>
                          <span className="staff-username">{user.email || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="staff-role-badge" style={{ textTransform: "capitalize" }}>
                        {user.tenant_role || "none"}
                      </span>
                    </td>
                    <td>
                      <div className="staff-info">
                        <span className="staff-name" style={{ 
                          textTransform: "capitalize", 
                          fontSize: "14px", 
                          fontWeight: "600",
                          color: "var(--text-main)"
                        }}>
                          {user.platform_role === "none" ? "Standard User" : user.platform_role.replace("_", " ")}
                        </span>
                        <div style={{ marginTop: "4px" }}>
                          <span className={`staff-role-badge ${user.status === "active" ? "verified" : user.status === "inactive" ? "pending" : "rejected"}`} style={{ 
                            fontSize: "10px", 
                            padding: "2px 8px",
                            borderRadius: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            height: "20px",
                            textTransform: "capitalize"
                          }}>
                            {user.status || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="staff-username">
                        {new Date(user.joined_at || user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons" style={{ justifyContent: "flex-end", gap: "8px" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          style={{ 
                            width: "36px", 
                            height: "36px", 
                            padding: 0, 
                            display: "inline-flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            borderRadius: "10px",
                            backgroundColor: "var(--bg-light)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-main)",
                            transition: "all 0.2s"
                          }}
                          className="hover-scale"
                          title="Force Logout"
                          onClick={() => setConfirmLogoutUser(user)}
                        >
                          <FaSignOutAlt size={14} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          style={{ 
                            width: "36px", 
                            height: "36px", 
                            padding: 0, 
                            display: "inline-flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            borderRadius: "10px",
                            backgroundColor: "rgba(220, 38, 38, 0.05)",
                            border: "1px solid rgba(220, 38, 38, 0.1)",
                            color: "#dc2626",
                            transition: "all 0.2s"
                          }}
                          className="hover-scale"
                          title="Delete User"
                          onClick={() => setConfirmDeleteUser(user)}
                        >
                          <FaTrash size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {confirmDeleteUser && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to permanently delete the user ${confirmDeleteUser.name || confirmDeleteUser.email}? This action cannot be undone.`}
          confirmLabel="Delete User"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteUser(null)}
          submitting={submitting}
        />
      )}

      {confirmLogoutUser && (
        <ConfirmModal
          title="Force Logout"
          message={`Are you sure you want to invalidate all active sessions for ${confirmLogoutUser.name || confirmLogoutUser.email}? They will be forced to log in again.`}
          confirmLabel="Force Logout"
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogoutUser(null)}
          submitting={submitting}
        />
      )}
    </>
  );
};

export default SuperAdminUsersList;
