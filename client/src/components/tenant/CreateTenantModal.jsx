import { useEffect, useState } from "react";
import { FiX, FiHome, FiMail, FiPhone, FiHash, FiMapPin, FiFileText, FiArrowLeft, FiCamera, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth.js";
import { createTenant, verifyGSTIN } from "../../api/tenant.api.js";
import { checkAuth } from "../../features/auth/auth.actions.js";
import { Spinner } from "../ui/Spinner.jsx";
import "../../styles/tenant-gate.css";

const DRAFT_KEY = "fgcrm_tenant_draft";

export const TENANT_REQUIRED_FIELDS = [
  { id: "tenant-companyName", key: "companyName", label: "Company Name" },
  { id: "tenant-companyEmail", key: "companyEmail", label: "Company Email" },
  { id: "tenant-companyPhone", key: "companyPhone", label: "Contact No" },
];

const InputWrapper = ({ icon: Icon, label, required, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Icon size={14} style={{ color: '#7c3aed' }} />
      <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
    </div>
    {children}
  </div>
);

export const CreateTenantModal = ({ onClose }) => {
  const { user, dispatch } = useAuth();

  const [form, setForm] = useState({
    companyName: "",
    gstin: "",
    officialAddress: "",
    companyEmail: "",
    companyPhone: "",
    companyLogo: null,
    gstCertificate: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoHover, setLogoHover] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isGstinVerified, setIsGstinVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [gstData, setGstData] = useState(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      setForm((prev) => ({ ...prev, ...saved }));
    } catch (err) { /* ignore draft errors */ }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: false }));
    if (name === "gstin") {
      setIsGstinVerified(false);
    }
  };

  const handleVerifyGSTIN = async () => {
    if (!form.gstin) {
      setError("Please enter a GSTIN first");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const resp = await verifyGSTIN(form.gstin);
      if (resp.data.success) {
        setGstData(resp.data.data);
        setForm(prev => ({
          ...prev,
          companyName: resp.data.data.details?.legalName || resp.data.data.organizationName || prev.companyName,
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

  const handleLogoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/svg+xml"].includes(file.type)) {
      setError("Logo must be an image (jpeg, jpg, png, svg).");
      return;
    }
    setError("");
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveDraft = () => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setError("");
    } catch {
      setError("Unable to save draft locally.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const missing = {};
    TENANT_REQUIRED_FIELDS.forEach((field) => {
      if (!form[field.key]) missing[field.key] = true;
    });

    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key !== 'companyLogo') formData.append(key, form[key]);
      });
      formData.append("email", user?.email);
      if (logoFile) formData.append("companyLogo", logoFile);
      formData.append("isGstVerified", isGstinVerified);

      await createTenant(formData);
      window.localStorage.removeItem(DRAFT_KEY);
      await checkAuth(dispatch);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create organization.");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="tenant-modal-overlay" style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="tenant-modal" style={{ maxWidth: '780px', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', position: 'relative' }}>
          {onClose && (
            <button type="button" onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '6px 12px', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <FiArrowLeft size={16} /> Back
            </button>
          )}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Organization Creation</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0' }}>Fill details to initialize your business profile.</p>
          </div>
          <div style={{ width: '80px' }} /> {/* Spacer for balance */}
        </div>

        {error && (
          <div style={{ padding: '8px 14px', background: '#fef2f2', color: '#ef4444', borderRadius: '10px', marginBottom: '16px', fontSize: '12px', border: '1px solid #fee2f2', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiX size={14} /> {error}
          </div>
        )}

        <form className="tenant-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', overflowY: 'auto', paddingRight: '4px' }}>
          <div className="tenant-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <InputWrapper icon={FiHash} label="GSTIN (Optional)">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  name="gstin"
                  className="tenant-input"
                  placeholder="27XXXX..."
                  value={form.gstin}
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
                    disabled={verifying || !form.gstin}
                    style={{
                      padding: '0 16px', borderRadius: '999px', background: form.gstin ? '#efe6ffff' : '#e3e3e3ff',
                      color: form.gstin ? '#8843ffff' : '#686868ff', border: 'none', fontWeight: 700, fontSize: '11px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', height: '38px', border: form.gstin ? '1px solid #c4a2ffff' : '1px solid #cacacaff'
                    }}
                  >
                    {verifying ? "Verifying..." : "Verify"}
                  </button>
                )}
              </div>

              {/* Exhaustive GSTIN Official Record Card */}
              {gstData && (
                <div style={{
                  margin: '12px 0',
                  padding: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <FiCheckCircle /> OFFICIAL RECORD (EXPRESSGST)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Legal Name</div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>{gstData.details?.legalName || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Status</div>
                      <div style={{ fontWeight: 700, fontSize: '0.75rem', color: gstData.details?.status === 'Active' ? '#10b981' : '#ef4444' }}>{gstData.details?.status || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Type</div>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#475569' }}>{gstData.details?.taxpayerType || '—'}</div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Core Activity</div>
                      <div style={{ fontWeight: 600, fontSize: '0.7rem', color: '#475569' }}>{gstData.details?.natureOfCoreActivity || '—'}</div>
                    </div>
                  </div>
                </div>
              )}
            </InputWrapper>

            <InputWrapper icon={FiHome} label="Company Name" required>
              <input
                type="text"
                name="companyName"
                className={`tenant-input${fieldErrors.companyName ? " tenant-input-error" : ""}`}
                placeholder="e.g. Acme Solutions"
                value={form.companyName}
                onChange={handleChange}
                style={{ height: '38px', borderRadius: '10px', fontSize: '13px' }}
              />
            </InputWrapper>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputWrapper icon={FiMail} label="Email" required>
                <input
                  type="email"
                  name="companyEmail"
                  className={`tenant-input${fieldErrors.companyEmail ? " tenant-input-error" : ""}`}
                  placeholder="contact@company.com"
                  value={form.companyEmail}
                  onChange={handleChange}
                  style={{ height: '38px', borderRadius: '10px', fontSize: '13px' }}
                />
              </InputWrapper>

              <InputWrapper icon={FiPhone} label="Contact No" required>
                <input
                  type="tel"
                  name="companyPhone"
                  className={`tenant-input${fieldErrors.companyPhone ? " tenant-input-error" : ""}`}
                  placeholder="+91 XXXXX"
                  value={form.companyPhone}
                  onChange={handleChange}
                  style={{ height: '38px', borderRadius: '10px', fontSize: '13px' }}
                />
              </InputWrapper>
            </div>

            <InputWrapper icon={FiMapPin} label="Official Address">
              <textarea
                name="officialAddress"
                className="tenant-input"
                placeholder="Full registered address..."
                value={form.officialAddress}
                onChange={handleChange}
                style={{ height: '60px', resize: 'none', paddingTop: '8px', borderRadius: '10px', fontSize: '13px' }}
              />
            </InputWrapper>

            <InputWrapper icon={FiFileText} label="GST Certificate Reference">
              <input
                type="text"
                name="gstCertificate"
                className="tenant-input"
                placeholder="Doc ID (optional)"
                value={form.gstCertificate}
                onChange={handleChange}
                style={{ height: '38px', borderRadius: '10px', fontSize: '13px' }}
              />
            </InputWrapper>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px', background: '#f8fafc', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization Logo</span>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                <label
                  className={`tenant-logo-box${logoHover ? " tenant-logo-box-hover" : ""}`}
                  style={{ borderRadius: '50%', border: '2px dashed #cbd5e1', width: '120px', height: '120px', background: 'white' }}
                  htmlFor="tenant-companyLogo"
                  onMouseEnter={() => setLogoHover(true)}
                  onMouseLeave={() => setLogoHover(false)}
                >
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Preview" className="tenant-logo-preview" style={{ borderRadius: '50%' }} />
                      <div className="tenant-logo-overlay" style={{ borderRadius: '50%' }}>
                        <FiCamera size={18} />
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                      <FiCamera size={24} />
                      <span style={{ fontSize: '10px', fontWeight: 600 }}>Upload</span>
                    </div>
                  )}
                </label>
                <input id="tenant-companyLogo" type="file" accept="image/*" className="tenant-logo-input" onChange={handleLogoChange} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '16px', overflow: 'hidden' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', fontWeight: 800 }}>Owner Account</p>
              <p
                style={{ fontSize: '12px', fontWeight: 600, color: '#475569', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={user?.email}
              >
                {user?.email}
              </p>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button type="button" className="btn tenant-btn-draft" onClick={saveDraft} disabled={submitting}
                style={{ width: '100%', height: '40px', borderRadius: '999px', background: 'white', color: '#64748b', fontSize: '12px', fontWeight: 700, border: '1px solid #e2e8f0' }}>
                Save Draft
              </button>
              <button type="submit" className="btn tenant-btn-submit" disabled={submitting}
                style={{ width: '100%', height: '40px', borderRadius: '999px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', fontSize: '12px', fontWeight: 700, boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)' }}>
                {submitting ? "Submitting..." : "Submit Profile"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTenantModal;
