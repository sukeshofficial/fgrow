import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllTenants, approveTenant, rejectTenant } from "../../api/tenant.api";
import { Button } from "../../components/ui/Button";
import { FaSearch, FaCheck, FaTimes, FaEye } from "react-icons/fa";
import Sidebar from "../../components/SideBar";

import "../../styles/welcome.css";
import "../../styles/admin-dashboard.css";

const AdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

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

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this tenant?")) return;
    try {
      await approveTenant(id);
      fetchTenants();
    } catch (err) {
      alert("Approval failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await rejectTenant(id, reason);
      fetchTenants();
    } catch (err) {
      alert("Rejection failed: " + (err.response?.data?.message || err.message));
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
                              onClick={() => handleApprove(tenant._id)}
                            >
                              <FaCheck />
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              className="icon-btn reject-btn"
                              onClick={() => handleReject(tenant._id)}
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
    </div>
  );
};

export default AdminDashboard;