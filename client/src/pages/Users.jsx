import React, { useState, useEffect } from "react";
import SideBar from "../components/SideBar";
import StaffListTable from "../components/tenant/StaffListTable";
import InviteUserModal from "../components/tenant/InviteUserModal";
import { getPendingInvitations, revokeInvitation } from "../api/invitation.api";
import { Button } from "../components/ui/Button";
import { FaUserPlus, FaEnvelope, FaTrashAlt, FaClock } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import "../styles/dashboard.css";
import "../styles/welcome.css";
import { Spinner } from "../components/ui/Spinner";
import { useModal } from "../context/ModalContext";
import logger from "../utils/logger.js";

const Users = () => {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [activeTab, setActiveTab] = useState("joined"); // joined, pending
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshStaffKey, setRefreshStaffKey] = useState(0);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === "pending") {
      fetchInvites();
    }
  }, [activeTab]);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const response = await getPendingInvitations();
      setInvites(response.data.data);
    } catch (err) {
      logger.error("UsersPage", "Failed to fetch invitations", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUninvite = async (id) => {
    const confirmed = await showConfirm(
      "Revoke Invitation",
      "Are you sure you want to revoke this invitation?",
      "delete"
    );
    if (!confirmed) return;

    try {
      await revokeInvitation(id);
      fetchInvites();
    } catch (err) {
      await showAlert("Error", "Failed to revoke invitation", "error");
    }
  };

  const handleInviteSuccess = () => {
    if (activeTab === "pending") fetchInvites();
    else setRefreshStaffKey(prev => prev + 1);
  };

  return (
    <div className="dashboard">
      <SideBar />

      <div className="dashboard-content" style={{ padding: '2rem' }}>
        <div className="dashboard-header-row">
          <h1 className="dashboard-title">User Management</h1>
          {user?.tenant_role === "owner" && (
            <Button variant="primary" onClick={() => setIsInviteModalOpen(true)}>
              <FaUserPlus style={{ marginRight: '8px' }} /> Invite Member
            </Button>
          )}
        </div>

        <div className="filter-tabs" style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', width: 'fit-content', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab("joined")}
            style={{
              padding: '8px 24px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTab === "joined" ? '600' : '400',
              backgroundColor: activeTab === "joined" ? 'white' : 'transparent',
              color: activeTab === "joined" ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === "joined" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Joined Members
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            style={{
              padding: '8px 24px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTab === "pending" ? '600' : '400',
              backgroundColor: activeTab === "pending" ? 'white' : 'transparent',
              color: activeTab === "pending" ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === "pending" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Pending Invitations
          </button>
        </div>

        <div className="staff-list-card" style={{ margin: 0 }}>
          {activeTab === "joined" ? (
            <StaffListTable refreshKey={refreshStaffKey} />
          ) : (
            <div className="staff-table-container">
              {loading ? (
                <div className="staff-loading" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                  <Spinner />
                </div>
              ) : invites.length === 0 ? (
                <div className="staff-loading">You don't have any invite</div>
              ) : (
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Invited User</th>
                      <th>Role</th>
                      <th>Sent Date</th>
                      <th>Expires</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((invite) => (
                      <tr key={invite._id}>
                        <td>
                          <div className="staff-member-cell">
                            <div className="staff-avatar-placeholder" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                              <FaEnvelope />
                            </div>
                            <div className="staff-info">
                              <span className="staff-name">{invite.email}</span>
                              <span className="staff-username">Invited by: {invite.invited_by?.name}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`staff-role-badge role-${invite.tenant_role}`}>
                            {invite.tenant_role}
                          </span>
                        </td>
                        <td>
                          <span className="staff-username">
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.875rem' }}>
                            <FaClock style={{ fontSize: '0.75rem' }} />
                            {new Date(invite.expires_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            style={{ color: '#ef4444', padding: '6px 12px' }}
                            onClick={() => handleUninvite(invite._id)}
                          >
                            <FaTrashAlt style={{ marginRight: '6px' }} /> Uninvite
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {isInviteModalOpen && (
        <InviteUserModal
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  );
};

export default Users;
