import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getTenantById, getTenantStaffAdmin, getTenantClientsAdmin, approveTenant, rejectTenant } from "../../api/tenant.api";
import { Button } from "../../components/ui/Button";
import { 
  FaArrowLeft, FaCheck, FaTimes, FaUsers, FaUserTie, FaBuilding, 
  FaEnvelope, FaPhone, FaGlobe, FaFileInvoice, FaMapMarkerAlt,
  FaClock, FaCoins, FaCalendarAlt, FaRedoAlt, FaInfoCircle, FaShieldAlt
} from "react-icons/fa";
import Sidebar from "../../components/SideBar";
import Toast from "../../components/ui/Toast";
import RejectionModal from "../../components/tenant/RejectionModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import "../../styles/welcome.css";

// Shared style for section headings inside the profile card
const sectionLabel = {
  fontSize: '0.68rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#94a3b8',
  marginBottom: '0.625rem',
};

// Reusable row: icon + optional label + value
const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#64748b', fontSize: '0.8125rem' }}>
    <span style={{ opacity: 0.7, flexShrink: 0, marginTop: '2px' }}>{icon}</span>
    <span>
      {label && <span style={{ color: '#94a3b8', marginRight: '4px' }}>{label}:</span>}
      {value}
    </span>
  </div>
);

const TenantDetailView = () => {
  const { tenantId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // UI States
  const [toasts, setToasts] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
      console.error("Fetch Data Error:", err);
      setError("Failed to fetch tenant details.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    try {
      setActionLoading(true);
      await approveTenant(tenantId);
      setShowApproveModal(false);
      addToast(`${tenant.name} has been approved successfully!`, "success");
      fetchData();
    } catch (err) {
      addToast("Failed to approve tenant.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      setActionLoading(true);
      await rejectTenant(tenantId, reason);
      addToast(`${tenant.name} has been rejected.`, "success");
      setShowRejectModal(false);
      fetchData();
    } catch (err) {
      addToast("Failed to reject tenant.", "error");
    } finally {
      setActionLoading(false);
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
              <Button 
                variant="primary" 
                onClick={handleApprove} 
                style={{ backgroundColor: '#22c55e' }}
                disabled={actionLoading}
              >
                <FaCheck style={{ marginRight: '8px' }} /> Approve
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowRejectModal(true)} 
                style={{ color: '#ef4444' }}
                disabled={actionLoading}
              >
                <FaTimes style={{ marginRight: '8px' }} /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="tenant-detail-grid">
        {/* Profile & Details Card */}
        <div className="staff-list-card profile-sidebar-card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Avatar + Name + Status */}
          <div style={{ textAlign: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt="logo" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.75rem', display: 'block' }} />
            ) : (
              <div className="staff-avatar-placeholder" style={{ width: 72, height: 72, fontSize: '2rem', margin: '0 auto 0.75rem' }}>
                {tenant.name[0].toUpperCase()}
              </div>
            )}
            <h3 style={{ margin: '0 0 0.5rem' }}>{tenant.name}</h3>
            <span className={`staff-role-badge ${
              tenant.verificationStatus === 'verified' ? 'role-staff' :
              tenant.verificationStatus === 'rejected' ? '' : 'role-owner'
            }`} style={tenant.verificationStatus === 'rejected' ? { background: '#fee2e2', color: '#ef4444' } : {}}>
              {tenant.verificationStatus}
            </span>
          </div>

          {/* ── Contact Info ── */}
          <div style={{ padding: '1rem 0', borderBottom: '1px solid #f8fafc' }}>
            <p style={sectionLabel}>Contact</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <InfoRow icon={<FaEnvelope />} value={tenant.companyEmail || '—'} />
              <InfoRow icon={<FaPhone />} value={tenant.companyPhone || '—'} />
              <InfoRow icon={<FaBuilding />} value={tenant.ownerUserId?.name ? `${tenant.ownerUserId.name} (Owner)` : '—'} />
            </div>
          </div>

          {/* ── Business Info ── */}
          <div style={{ padding: '1rem 0', borderBottom: '1px solid #f8fafc' }}>
            <p style={sectionLabel}>Business</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <InfoRow icon={<FaFileInvoice />} label="GSTIN" value={tenant.gstNumber || '—'} />
              <InfoRow icon={<FaShieldAlt />} label="Reg. No" value={tenant.registrationNumber || '—'} />
              <InfoRow icon={<FaGlobe />} label="Domain" value={tenant.domain || '—'} />
              <InfoRow icon={<FaInfoCircle />} label="Plan" value={tenant.plan || '—'} />
              <InfoRow icon={<FaCoins />} label="Currency" value={tenant.currency || '—'} />
              <InfoRow icon={<FaClock />} label="Timezone" value={tenant.timezone || '—'} />
            </div>
          </div>

          {/* ── Address ── */}
          {tenant.companyAddress && Object.values(tenant.companyAddress).some(Boolean) && (
            <div style={{ padding: '1rem 0', borderBottom: '1px solid #f8fafc' }}>
              <p style={sectionLabel}>Address</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#64748b', fontSize: '0.8125rem' }}>
                <FaMapMarkerAlt style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>
                  {[
                    tenant.companyAddress.street,
                    tenant.companyAddress.city,
                    tenant.companyAddress.state,
                    tenant.companyAddress.postalCode,
                    tenant.companyAddress.country,
                  ].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
            </div>
          )}

          {/* ── Timeline ── */}
          <div style={{ padding: '1rem 0', borderBottom: '1px solid #f8fafc' }}>
            <p style={sectionLabel}>Timeline</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <InfoRow icon={<FaCalendarAlt />} label="Submitted" value={tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
              {tenant.verifiedBy && <InfoRow icon={<FaCheck />} label="Reviewed by" value={tenant.verifiedBy?.name || '—'} />}
              {tenant.verifiedAt && <InfoRow icon={<FaClock />} label="Reviewed on" value={new Date(tenant.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />}
            </div>
          </div>

          {/* ── Appeals ── */}
          {(tenant.appealCount > 0 || tenant.lastAppealedAt) && (
            <div style={{ padding: '1rem 0', borderBottom: '1px solid #f8fafc' }}>
              <p style={sectionLabel}>Appeals</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <InfoRow icon={<FaRedoAlt />} label="Appeal Count" value={`${tenant.appealCount} / 3`} />
                {tenant.lastAppealedAt && (
                  <InfoRow icon={<FaCalendarAlt />} label="Last Appeal" value={new Date(tenant.lastAppealedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
                )}
              </div>
            </div>
          )}

          {/* ── Rejection Reason ── */}
          {tenant.rejection_reason && (
            <div style={{ padding: '1rem 0' }}>
              <p style={sectionLabel}>Rejection Reason</p>
              <p style={{ fontSize: '0.8125rem', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.625rem 0.75rem', lineHeight: 1.5 }}>
                {tenant.rejection_reason}
              </p>
            </div>
          )}

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
                        <td>{c.name}</td>
                        <td>{c.primary_contact_email || 'N/A'}</td>
                        <td>{c.primary_contact_mobile || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>

      {/* Overlays */}
      {showApproveModal && (
        <ConfirmModal
          title="Approve Tenant"
          message={`Are you sure you want to approve ${tenant.name}? They will immediately gain access to the platform.`}
          confirmLabel="Approve"
          confirmColor="#22c55e"
          onCancel={() => setShowApproveModal(false)}
          onConfirm={handleApproveConfirm}
          submitting={actionLoading}
        />
      )}

      {showRejectModal && (
        <RejectionModal
          tenantName={tenant.name}
          onCancel={() => setShowRejectModal(false)}
          onConfirm={handleRejectConfirm}
          submitting={actionLoading}
        />
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default TenantDetailView;
