import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllTenants, approveTenant, rejectTenant } from "../../api/tenant.api";
import { Button } from "../../components/ui/Button";
import { FaSearch, FaCheck, FaTimes, FaEye, FaFilter } from "react-icons/fa";
import Sidebar from "../../components/SideBar";

import "../../styles/welcome.css";

const AdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, verified, rejected

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
        <div className="admin-stats-summary" style={{ display: 'flex', gap: '2rem' }}>
          <div className="stat-item">
            <span className="stat-label">Total Tenants:</span>
            <span className="stat-value" style={{ fontWeight: 'bold', marginLeft: '8px' }}>{tenants.length}</span>
          </div>
        </div>
      </div>

      <div className="admin-controls" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', alignItems: 'center' }}>
        <div className="search-box" style={{ position: 'relative', flex: 1 }}>
          <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-65%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search tenants by name or email..."
            className="tenant-input"
            style={{ paddingLeft: '40px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-tabs" style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          {['all', 'pending', 'verified', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                textTransform: 'capitalize',
                backgroundColor: filter === f ? 'white' : 'transparent',
                color: filter === f ? '#4f46e5' : '#64748b',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="staff-list-card" style={{ margin: 0 }}>
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
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>
                      <div className="staff-member-cell">
                        <div className="staff-avatar-placeholder" style={{ backgroundColor: '#e2e8f0' }}>
                          <img src={tenant.logoUrl} alt="logo" className="tenant-logo-super-admin"/>
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
                      <span className={`staff-role-badge ${tenant.verificationStatus === 'verified' ? 'role-staff' :
                        tenant.verificationStatus === 'pending' ? 'role-owner' : 'role-rejected'
                        }`} style={{
                          backgroundColor: tenant.verificationStatus === 'rejected' ? '#fee2e2' : undefined,
                          color: tenant.verificationStatus === 'rejected' ? '#991b1b' : undefined,
                        }}>
                        {tenant.verificationStatus}
                      </span>
                    </td>
                    <td>
                      <span className="staff-username">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Link to={`/admin/tenants/${tenant._id}`}>
                          <Button variant="secondary" size="sm" style={{ padding: '6px 10px' }} title="View Details">
                            <FaEye />
                          </Button>
                        </Link>
                        {tenant.verificationStatus === 'pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              style={{ padding: '6px 10px', backgroundColor: '#22c55e' }}
                              onClick={() => handleApprove(tenant._id)}
                              title="Approve"
                            >
                              <FaCheck />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              style={{ padding: '6px 10px', color: '#ef4444' }}
                              onClick={() => handleReject(tenant._id)}
                              title="Reject"
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
