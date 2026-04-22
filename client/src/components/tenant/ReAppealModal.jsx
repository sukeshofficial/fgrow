import { useState, useEffect } from "react";
import { FiX, FiHome, FiMail, FiPhone, FiHash, FiMapPin, FiArrowLeft, FiCheckCircle, FiRefreshCw, FiGlobe, FiDollarSign } from "react-icons/fi";
import { verifyGSTIN } from "../../api/tenant.api.js";
import "../../styles/tenant-gate.css";
import "../../styles/reappeal-modal.css";

const InputWrapper = ({ icon: Icon, label, required, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Icon size={12} style={{ color: '#7c3aed' }} />
      <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
    </div>
    {children}
  </div>
);

const ReAppealModal = ({ tenant, onConfirm, onCancel, submitting }) => {
  const [form, setForm] = useState({
    name: tenant?.name || "",
    companyEmail: tenant?.companyEmail || "",
    companyPhone: tenant?.companyPhone || "",
    gstNumber: tenant?.gstNumber || "",
    registrationNumber: tenant?.registrationNumber || "",
    timezone: tenant?.timezone || "Asia/Kolkata",
    currency: tenant?.currency || "INR",
    officialAddress: tenant?.officialAddress || "",
    street: tenant?.companyAddress?.street || "",
    city: tenant?.companyAddress?.city || "",
    state: tenant?.companyAddress?.state || "",
    postalCode: tenant?.companyAddress?.postalCode || "",
    country: tenant?.companyAddress?.country || "",
  });

  const [verifying, setVerifying] = useState(false);
  const [isGstinVerified, setIsGstinVerified] = useState(tenant?.isGstVerified || false);
  const [gstData, setGstData] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "gstNumber") {
      setIsGstinVerified(false);
      setGstData(null);
    }
  };

  const handleVerifyGSTIN = async () => {
    if (!form.gstNumber) {
      setError("Please enter a GSTIN first");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const resp = await verifyGSTIN(form.gstNumber);
      if (resp.data.success) {
        setGstData(resp.data.data);
        setForm(prev => ({
          ...prev,
          name: resp.data.data.details?.legalName || resp.data.data.organizationName || prev.name,
          officialAddress: resp.data.data.address || prev.officialAddress
        }));
        setIsGstinVerified(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify GSTIN. Please enter details manually.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.companyEmail) return;

    onConfirm({
      ...form,
      isGstVerified: isGstinVerified,
      companyAddress: {
        street: form.street,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
      },
    });
  };



  return (
    <div className="tenant-modal-overlay" style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="tenant-modal" style={{ maxWidth: '820px', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', position: 'relative' }}>
          <button type="button" onClick={onCancel}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '6px 12px', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            <FiArrowLeft size={16} /> Back
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#7c3aed' }}>
              <FiRefreshCw size={20} className={submitting ? "reappeal-spin" : ""} />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Submit Re-appeal</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0' }}>Review and correct your details for reconsideration.</p>
          </div>
          <div style={{ width: '80px' }} />
        </div>

        {tenant?.rejection_reason && (
          <div style={{ padding: '12px 16px', background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Previous Rejection Reason</div>
            <p style={{ margin: 0, fontSize: '13px', color: '#9f1239', lineHeight: 1.5, fontWeight: 500 }}>{tenant.rejection_reason}</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '8px 14px', background: '#fef2f2', color: '#ef4444', borderRadius: '10px', marginBottom: '16px', fontSize: '12px', border: '1px solid #fee2f2', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiX size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', overflowY: 'auto', paddingRight: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginTop: 0 }}>Entity Information</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <InputWrapper icon={FiHash} label="GSTIN (Highly Recommended)">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      name="gstNumber"
                      className="tenant-input"
                      placeholder="27XXXX..."
                      value={form.gstNumber}
                      onChange={handleChange}
                      style={{ flex: 1, height: '38px', borderRadius: '10px', fontSize: '13px' }}
                    />
                    {isGstinVerified ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700, fontSize: '11px', padding: '0 8px' }}>
                        <FiCheckCircle size={14} /> VERIFIED
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerifyGSTIN}
                        disabled={verifying || !form.gstNumber}
                        style={{
                          padding: '0 16px', borderRadius: '999px', background: form.gstNumber ? '#efe6ffff' : '#e2e8f0',
                          color: '#8843ffff', border: 'none', fontWeight: 700, fontSize: '11px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', height: '38px', border: '1px solid #c4a2ffff'
                        }}
                      >
                        {verifying ? "Verifying..." : "Verify"}
                      </button>
                    )}
                  </div>
                </InputWrapper>

                {gstData && (
                  <div style={{
                    margin: '4px 0', padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px',
                    display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ color: '#6366f1', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>Official Record Match</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94a3b8' }}>Legal Name</div>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b' }}>{gstData.details?.legalName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94a3b8' }}>Status</div>
                        <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#10b981' }}>{gstData.details?.status}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94a3b8' }}>Type</div>
                        <div style={{ fontWeight: 600, fontSize: '0.7rem', color: '#475569' }}>{gstData.details?.taxpayerType}</div>
                      </div>
                    </div>
                  </div>
                )}

                <InputWrapper icon={FiHome} label="Company Name" required>
                  <input type="text" name="name" className="tenant-input" value={form.name} onChange={handleChange} style={{ height: '38px', borderRadius: '10px', fontSize: '13px' }} />
                </InputWrapper>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <InputWrapper icon={FiMail} label="Email" required>
                    <input type="email" name="companyEmail" className="tenant-input" value={form.companyEmail} onChange={handleChange} style={{ height: '38px', borderRadius: '10px', fontSize: '13px' }} />
                  </InputWrapper>
                  <InputWrapper icon={FiPhone} label="Contact" required>
                    <input type="tel" name="companyPhone" className="tenant-input" value={form.companyPhone} onChange={handleChange} style={{ height: '38px', borderRadius: '10px', fontSize: '13px' }} />
                  </InputWrapper>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 4px' }}>
              <InputWrapper icon={FiMapPin} label="Official Registered Address (GST/ROC)">
                <textarea name="officialAddress" className="tenant-input" value={form.officialAddress} onChange={handleChange} style={{ height: '50px', borderRadius: '10px', fontSize: '13px', resize: 'none', paddingTop: '8px' }} />
              </InputWrapper>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginTop: 0 }}>Regional Settings</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <InputWrapper icon={FiGlobe} label="Timezone">
                  <input type="text" name="timezone" className="tenant-input" value={form.timezone} onChange={handleChange} style={{ height: '38px', borderRadius: '10px', fontSize: '13px' }} />
                </InputWrapper>
                <InputWrapper icon={FiDollarSign} label="Preferred Currency">
                  <select name="currency" className="tenant-input" value={form.currency} onChange={handleChange} style={{ height: '38px', borderRadius: '10px', fontSize: '13px' }}>
                    <option value="INR">INR – Rupee</option>
                    <option value="USD">USD – Dollar</option>
                    <option value="EUR">EUR – Euro</option>
                  </select>
                </InputWrapper>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '18px', border: '1px solid #f1f5f9', marginTop: 'auto' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>Validation Required</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="button" onClick={onCancel} disabled={submitting}
                  style={{ width: '100%', height: '40px', borderRadius: '12px', background: 'white', color: '#64748b', fontSize: '12px', fontWeight: 700, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !form.name || !form.companyEmail}
                  style={{ width: '100%', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)' }}>
                  {submitting ? "Submitting..." : "Submit Re-appeal"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReAppealModal;
