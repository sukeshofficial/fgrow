import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllTenants, approveTenant, rejectTenant } from "../../api/tenant.api";
import { Button } from "../../components/ui/Button";
import { FaSearch, FaCheck, FaTimes, FaEye, FaUserCircle } from "react-icons/fa";
import Sidebar from "../../components/SideBar";
import ConfirmModal from "../../components/ui/ConfirmModal";
import RejectionModal from "../../components/tenant/RejectionModal";
import TableSkeleton from "../../components/skeletons/TableSkeleton";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import BugReportsList from "./BugReportsList";
import LaunchManagement from "./LaunchManagement";
import SuperAdminUsersList from "./SuperAdminUsersList";
import ReleaseNotesManagement from "./ReleaseNotesManagement";
import FeedbackList from "./FeedbackList";
import { useAuth } from "../../hooks/useAuth";
import { Building2, Bug, MessageSquare, Rocket, FileText, Users } from "lucide-react";

import "../../styles/welcome.css";
import "../../styles/admin-dashboard.css";

const AdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useDelayedLoading(loading, 300);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirmApproveId, setConfirmApproveId] = useState(null);
  const [rejectingTenant, setRejectingTenant] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("tenants");
  const { user, avatar } = useAuth();

  useEffect(() => {
    fetchTenants();
  }, [filter]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === "all" ? "" : filter;
      const response = await getAllTenants(statusFilter);
      setTenants(response.data.data);
    } catch (err) {
      setError("Failed to fetch tenants.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirmApproveId) return;
    try {
      setSubmitting(true);
      await approveTenant(confirmApproveId);
      setConfirmApproveId(null);
      fetchTenants();
    } catch (err) {
      alert("Approval failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectingTenant) return;
    try {
      setSubmitting(true);
      await rejectTenant(rejectingTenant._id, reason);
      setRejectingTenant(null);
      fetchTenants();
    } catch (err) {
      alert("Rejection failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.companyEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="dashboard-header-row" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="dashboard-title">Super Admin Dashboard</h1>

          <div className="filter-tabs" style={{ margin: "16px 0 0 0", gap: "8px", background: "transparent", padding: 0 }}>
            {[
              { id: 'tenants', label: 'Tenants', icon: Building2 },
              { id: 'reports', label: 'Bug Reports', icon: Bug },
              { id: 'feedback', label: 'Feedback', icon: MessageSquare },
              { id: 'launch', label: 'Launch', icon: Rocket },
              { id: 'release-notes', label: 'Release Notes', icon: FileText },
              { id: 'users', label: 'Users', icon: Users }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`filter-tabs-btn ${isActive ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: isActive ? 'white' : 'transparent',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontWeight: isActive ? '600' : '500',
                    border: '1px solid transparent',
                    borderColor: isActive ? '#e2e8f0' : 'transparent'
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? '#4f46e5' : '#64748b' }} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "6px 16px 6px 6px", borderRadius: "999px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          {avatar ? (
            <img src={avatar} alt="Profile" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", lineHeight: "1.2" }}>{user?.name || "Admin"}</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Super Admin</span>
          </div>
        </div>
      </div>

      {activeTab === 'tenants' ? (
        <>
          <div className="admin-controls">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search tenants by name or email..."
                className="tenant-input search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-tabs">
              {['all', 'pending', 'verified', 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`filter-tabs-btn ${filter === f ? 'active' : ''}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="staff-list-card no-margin">
            <div className="staff-table-container">
              {showLoading ? (
                <div style={{ padding: '20px' }}>
                  <TableSkeleton rows={5} columns={5} />
                </div>
              ) : error ? (
                <div className="staff-error">{error}</div>
              ) : filteredTenants.length === 0 ? (
                <div className="staff-loading">No tenants found matching your criteria.</div>
              ) : (
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Tenant / Company</th>
                      <th>Owner</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTenants.map((tenant) => (
                      <tr key={tenant._id}>
                        <td>
                          <div className="staff-member-cell">
                            <div className="staff-avatar-placeholder avatar-bg">
                              {tenant.logoUrl ? (
                                <img src={tenant.logoUrl} alt="logo" className="tenant-logo-super-admin" />
                              ) : (
                                <FaUserCircle size={32} />
                              )}
                            </div>
                            <div className="staff-info">
                              <span className="staff-name">{tenant.name}</span>
                              <span className="staff-username">{tenant.companyEmail}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="staff-info">
                            <span className="staff-name">{tenant.ownerUserId?.name || 'Unknown'}</span>
                            <span className="staff-username">{tenant.ownerUserId?.email || 'N/A'}</span>
                          </div>
                        </td>

                        <td>
                          <span className={`staff-role-badge ${tenant.verificationStatus}`}>
                            {tenant.verificationStatus}
                          </span>
                        </td>

                        <td>
                          <span className="staff-username">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="text-right">
                          <div className="action-buttons">
                            <Link to={`/admin/tenants/${tenant._id}`}>
                              <Button variant="secondary" size="sm" className="icon-btn">
                                <FaEye />
                              </Button>
                            </Link>

                            {tenant.verificationStatus === 'pending' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="icon-btn approve-btn"
                                  onClick={() => setConfirmApproveId(tenant._id)}
                                >
                                  <FaCheck />
                                </Button>

                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="icon-btn reject-btn"
                                  onClick={() => setRejectingTenant(tenant)}
                                >
                                  <FaTimes />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {confirmApproveId && (
            <ConfirmModal
              title="Approve Tenant"
              message="Are you sure you want to approve this tenant? They will gain full access to the platform."
              confirmLabel="Approve Tenant"
              onConfirm={handleApprove}
              onCancel={() => setConfirmApproveId(null)}
              submitting={submitting}
            />
          )}

          {rejectingTenant && (
            <RejectionModal
              tenantName={rejectingTenant.name}
              onConfirm={handleReject}
              onCancel={() => setRejectingTenant(null)}
              submitting={submitting}
            />
          )}
        </>
      ) : activeTab === 'reports' ? (
        <BugReportsList />
      ) : activeTab === 'feedback' ? (
        <FeedbackList />
      ) : activeTab === 'launch' ? (
        <LaunchManagement />
      ) : activeTab === 'release-notes' ? (
        <ReleaseNotesManagement />
      ) : (
        <SuperAdminUsersList />
      )}
    </div>
  );
};

export default AdminDashboard;
