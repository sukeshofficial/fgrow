import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getTenantById, getTenantStaffAdmin, getTenantClientsAdmin, approveTenant, rejectTenant } from "../../api/tenant.api";
import { Button } from "../../components/ui/Button";
import {
  FaArrowLeft, FaCheck, FaTimes, FaUsers, FaUserTie, FaBuilding,
  FaEnvelope, FaPhone, FaGlobe, FaFileInvoice, FaMapMarkerAlt,
  FaClock, FaCoins, FaCalendarAlt, FaRedoAlt, FaInfoCircle, FaShieldAlt,
  FaUserCircle, FaCheckCircle
} from "react-icons/fa";
import Sidebar from "../../components/SideBar";
import Toast from "../../components/ui/Toast";
import RejectionModal from "../../components/tenant/RejectionModal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import "../../styles/welcome.css";
import { Spinner } from "../../components/ui/Spinner";

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
const InfoRow = ({ icon, label, value, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#64748b', fontSize: '0.8125rem' }}>
    <span style={{ opacity: 0.7, flexShrink: 0, marginTop: '2px' }}>{icon}</span>
    <div style={{ flex: 1 }}>
      {label && <span style={{ color: '#94a3b8', marginRight: '4px' }}>{label}:</span>}
      {value}
      {children}
    </div>
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

  const [verifyingDetails, setVerifyingDetails] = useState(false);
  const [gstData, setGstData] = useState(null);

  const handleVerifyGSTIN = async () => {
    const gst = tenant.gstNumber;
    if (!gst) {
      addToast("No GSTIN provided for this tenant.", "error");
      return;
    }

    const gstClean = gst.trim().toUpperCase();
    const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

    if (!re.test(gstClean)) {
      addToast("Invalid GSTIN format.", "error");
      return;
    }

    setVerifyingDetails(true);
    setGstData(null);
    try {
      const { verifyGSTIN, verifyGstAdmin } = await import("../../api/tenant.api");
      const resp = await verifyGSTIN(gstClean);
      if (resp.data.success) {
        setGstData(resp.data.data);
        addToast("GSTIN details fetched successfully!", "success");

        if (!tenant.isAdminGstVerified) {
          try {
            await verifyGstAdmin(tenant._id);
            setTenant(prev => ({ ...prev, isAdminGstVerified: true }));
          } catch (adminErr) {
            console.error("Failed to sync admin verification status:", adminErr);
          }
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to verify GSTIN. Check with official portal.", "error");
    } finally {
      setVerifyingDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="staff-loading" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spinner />
      </div>
    );
  }
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
                <FaBuilding size={40} />
              </div>
            )}
            <h3 style={{ margin: '0 0 0.5rem' }}>{tenant.name}</h3>
            <span className={`staff-role-badge ${tenant.verificationStatus === 'verified' ? 'role-staff' :
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <InfoRow icon={<FaFileInvoice />} label="GSTIN" value={tenant.gstNumber || '—'} />
                {tenant.gstNumber && tenant.gstNumber !== '—' && (
                  tenant.isAdminGstVerified ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700, fontSize: '0.65rem' }}>
                      <FaCheckCircle /> Verified
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleVerifyGSTIN}
                      disabled={verifyingDetails}
                      style={{ fontSize: '0.65rem', padding: '1px 6px', height: '1.4rem', minWidth: 'auto', border: '1px solid #e2e8f0', color: verifyingDetails ? '#94a3b8' : '#6366f1', fontWeight: 700 }}
                    >
                      {verifyingDetails ? "Verifying..." : "Verify"}
                    </Button>
                  )
                )}
              </div>

              {/* GSTIN Official Record Card - High Density */}
              {gstData && (
                <div style={{
                  margin: '12px 0',
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <FaCheckCircle /> OFFICIAL RECORD (EXPRESSGST)
                  </div>

                  {/* ── Primary Info ── */}
                  <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Legal Name of Business</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{gstData.details?.legalName || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Trade Name</div>
                        <div style={{ fontWeight: 600, color: '#475569' }}>{gstData.details?.tradeName || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>GSTIN Status</div>
                        <div style={{ fontWeight: 700, color: gstData.details?.status === 'Active' ? '#10b981' : '#ef4444' }}>{gstData.details?.status || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* ── Registration & Authentication ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Taxpayer Type</div>
                      <div style={{ fontWeight: 600, color: '#475569' }}>{gstData.details?.taxpayerType || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Reg. Date</div>
                      <div style={{ fontWeight: 600, color: '#475569' }}>{gstData.details?.registrationDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Aadhaar Auth</div>
                      <div style={{ fontWeight: 700, color: gstData.details?.aadhaarAuthenticated === 'Yes' ? '#10b981' : '#94a3b8' }}>{gstData.details?.aadhaarAuthenticated || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>e-KYC Verified</div>
                      <div style={{ fontWeight: 700, color: gstData.details?.ekycVerified === 'Yes' ? '#10b981' : '#94a3b8' }}>{gstData.details?.ekycVerified || '—'}</div>
                    </div>
                  </div>

                  {/* ── Offices ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '2px' }}>Admin Office</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        <div><strong style={{ color: '#94a3b8' }}>Zone:</strong> {gstData.details?.administrativeOffice?.zone}</div>
                        <div><strong style={{ color: '#94a3b8' }}>Circle:</strong> {gstData.details?.administrativeOffice?.circle}</div>
                        <div><strong style={{ color: '#94a3b8' }}>Div:</strong> {gstData.details?.administrativeOffice?.division}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '2px' }}>Other Office</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        <div><strong style={{ color: '#94a3b8' }}>Zone:</strong> {gstData.details?.otherOffice?.zone}</div>
                        <div><strong style={{ color: '#94a3b8' }}>Range:</strong> {gstData.details?.otherOffice?.range}</div>
                      </div>
                    </div>
                  </div>

                  {/* ── Principal Place ── */}
                  <div style={{ paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '4px' }}>Principal Place of Business</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>{gstData.address}</div>
                  </div>

                  {/* ── Business Activities ── */}
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Core Activity</div>
                        <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.75rem' }}>{gstData.details?.natureOfCoreActivity || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Activities</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {gstData.details?.natureOfBusinessActivities?.map((act, i) => (
                            <span key={i} style={{ background: '#eef2ff', color: '#6366f1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700 }}>
                              {act}
                            </span>
                          )) || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                      <td>{s.name} <br /><small style={{ color: '#94a3b8' }}>{s.email}</small></td>
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
