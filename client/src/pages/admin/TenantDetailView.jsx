import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getTenantById, getTenantStaffAdmin, getTenantClientsAdmin, approveTenant, rejectTenant } from "../../api/tenant.api";
import { Button } from "../../components/ui/Button";
import { FaArrowLeft, FaCheck, FaTimes, FaUsers, FaUserTie, FaBuilding, FaEnvelope, FaPhone } from "react-icons/fa";
import Sidebar from "../../components/SideBar";
import "../../styles/welcome.css";

const TenantDetailView = () => {
  const { tenantId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes, cRes] = await Promise.all([
        getTenantById(tenantId),
        getTenantStaffAdmin(tenantId),
        getTenantClientsAdmin(tenantId)
      ]);
      setTenant(tRes.data.data);
      setStaff(sRes.data.data);
      setClients(cRes.data.data);
    } catch (err) {
      setError("Failed to fetch tenant details.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm("Approve this tenant?")) return;
    try {
      await approveTenant(tenantId);
      fetchData();
    } catch (err) {
      alert("Approval failed");
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Rejection reason:");
    if (!reason) return;
    try {
      await rejectTenant(tenantId, reason);
      fetchData();
    } catch (err) {
      alert("Rejection failed");
    }
  };

  if (loading) return <div className="staff-loading">Loading tenant details...</div>;
  if (error) return <div className="staff-error">{error}</div>;
  if (!tenant) return <div className="staff-error">Tenant not found.</div>;

  return (
    <div className="dashboard dashboard--left">
      <Sidebar />
      <div className="dashboard-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/admin/dashboard" style={{ color: '#64748b' }}><FaArrowLeft /></Link>
          <h1 className="dashboard-title">{tenant.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {tenant.verificationStatus === 'pending' && (
            <>
              <Button variant="primary" onClick={handleApprove} style={{ backgroundColor: '#22c55e' }}>
                <FaCheck style={{ marginRight: '8px' }} /> Approve
              </Button>
              <Button variant="secondary" onClick={handleReject} style={{ color: '#ef4444' }}>
                <FaTimes style={{ marginRight: '8px' }} /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="tenant-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Profile Card */}
        <div className="staff-list-card" style={{ margin: 0, height: 'fit-content' }}>
          <div style={{ textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
             <div className="staff-avatar-placeholder" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto 1rem' }}>
                {tenant.name[0].toUpperCase()}
             </div>
             <h3 style={{ margin: 0 }}>{tenant.name}</h3>
             <span className={`staff-role-badge ${tenant.verificationStatus === 'verified' ? 'role-staff' : 'role-owner'}`}>
                {tenant.verificationStatus}
             </span>
          </div>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.875rem' }}>
                <FaEnvelope /> <span>{tenant.companyEmail}</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.875rem' }}>
                <FaPhone /> <span>{tenant.companyPhone || 'No Phone'}</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.875rem' }}>
                <FaBuilding /> <span>{tenant.ownerUserId?.name} (Owner)</span>
             </div>
          </div>
        </div>

        {/* Staff & Clients Split View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           {/* Staff Section */}
           <div className="staff-list-card" style={{ margin: 0 }}>
              <h3 className="staff-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaUsers /> Tenant's Staffs ({staff.length})
              </h3>
              <div className="staff-table-container">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(s => (
                      <tr key={s._id}>
                        <td>{s.name} <br/><small style={{color: '#94a3b8'}}>{s.email}</small></td>
                        <td><span className={`staff-role-badge role-${s.tenant_role}`}>{s.tenant_role}</span></td>
                        <td>{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>

           {/* Clients Section */}
           <div className="staff-list-card" style={{ margin: 0 }}>
              <h3 className="staff-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaUserTie /> Tenant's Clients ({clients.length})
              </h3>
              <div className="staff-table-container">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c._id}>
                        <td>{c.full_name}</td>
                        <td>{c.email}</td>
                        <td>{c.mobile_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDetailView;
