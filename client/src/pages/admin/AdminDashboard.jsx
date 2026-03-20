import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllTenants, approveTenant, rejectTenant } from "../../api/tenant.api";
import { Button } from "../../components/ui/Button";
import { FaSearch, FaCheck, FaTimes, FaEye } from "react-icons/fa";
import Sidebar from "../../components/SideBar";
import ConfirmModal from "../../components/ui/ConfirmModal";
import RejectionModal from "../../components/tenant/RejectionModal";

import "../../styles/welcome.css";
import "../../styles/admin-dashboard.css";

const AdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirmApproveId, setConfirmApproveId] = useState(null);
  const [rejectingTenant, setRejectingTenant] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

      <div className="dashboard-header-row">
        <h1 className="dashboard-title">Super Admin Dashboard</h1>

        <div className="admin-stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Tenants:</span>
            <span className="stat-value">{tenants.length}</span>
          </div>
        </div>
      </div>

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
          {loading ? (
            <div className="staff-loading">Fetching tenants...</div>
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
                          <img src={tenant.logoUrl} alt="logo" className="tenant-logo-super-admin" />
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
    </div>
  );
};

export default AdminDashboard;