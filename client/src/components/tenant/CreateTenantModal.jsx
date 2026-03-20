import { useEffect, useState } from "react";

import { CiCamera } from "react-icons/ci";

import { useAuth } from "../../hooks/useAuth.js";
import { createTenant } from "../../api/tenant.api.js";
import { checkAuth } from "../../features/auth/auth.actions.js";
import cameraIcon from "../../assets/camera.png";
import { HiOutlineArrowLeft } from "react-icons/hi2";

import "../../styles/tenant-gate.css";

const DRAFT_KEY = "fgcrm_tenant_draft";

// Exported so you can extend required fields easily elsewhere
export const TENANT_REQUIRED_FIELDS = [
  {
    id: "tenant-companyName",
    key: "companyName",
    label: "Company Name",
  },
  {
    id: "tenant-companyEmail",
    key: "companyEmail",
    label: "Company Email",
  },
  {
    id: "tenant-companyPhone",
    key: "companyPhone",
    label: "Contact No",
  },
];

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      setForm((prev) => ({
        ...prev,
        ...saved,
      }));
    } catch {
      // ignore draft errors
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Logo must be an image (jpeg, jpg, png, svg).");
      setLogoFile(null);
      setLogoPreview(null);
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
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          companyName: form.companyName,
          gstin: form.gstin,
          officialAddress: form.officialAddress,
          companyEmail: form.companyEmail,
          companyPhone: form.companyPhone,
          gstCertificate: form.gstCertificate,
        }),
      );
      setError("");
    } catch {
      setError("Unable to save draft locally. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const missing = {};
    TENANT_REQUIRED_FIELDS.forEach((field) => {
      if (!form[field.key]) {
        missing[field.key] = true;
      }
    });

    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("companyName", form.companyName);
      formData.append("companyEmail", form.companyEmail);
      formData.append("companyPhone", form.companyPhone);
      formData.append("gstin", form.gstin);
      formData.append("officialAddress", form.officialAddress);
      formData.append("gstCertificate", form.gstCertificate);
      formData.append("email", user?.email);

      if (logoFile) {
        formData.append("companyLogo", logoFile);
      }

      await createTenant(formData);

      window.localStorage.removeItem(DRAFT_KEY);

      await checkAuth(dispatch);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to create tenant. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tenant-modal-overlay" aria-modal="true" role="dialog">
      <div className="tenant-modal">
        {onClose && (
          <button
            type="button"
            className="tenant-back-btn"
            onClick={onClose}
            aria-label="Go back"
          >
            <HiOutlineArrowLeft size={20} />
            <span>Back</span>
          </button>
        )}
        <h2 className="tenant-modal-title">Client Creation</h2>
        <p className="tenant-modal-subtitle">Fill details for approval</p>

        {error && <div className="tenant-form-error visible">{error}</div>}

        <form className="tenant-form" onSubmit={handleSubmit}>
          <div className="tenant-form-main">
            <div className="tenant-form-fields">
              <label className="tenant-label" htmlFor="tenant-companyName">
                <span className="tenant-label-heading">
                  Company Name <span className="tenant-required">*</span>
                </span>
                <input
                  type="text"
                  id="tenant-companyName"
                  name="companyName"
                  className={`tenant-input${fieldErrors.companyName ? " tenant-input-error" : ""
                    }`}
                  value={form.companyName}
                  onChange={handleChange}
                />
              </label>

              <label className="tenant-label" htmlFor="tenant-gstin">
                <span className="tenant-label-heading">GSTIN</span>
                <input
                  type="text"
                  id="tenant-gstin"
                  name="gstin"
                  className="tenant-input"
                  value={form.gstin}
                  onChange={handleChange}
                />
              </label>

              <label className="tenant-label" htmlFor="tenant-officialAddress">
                <span className="tenant-label-heading">Official Address</span>
                <input
                  type="text"
                  id="tenant-officialAddress"
                  name="officialAddress"
                  className="tenant-input"
                  value={form.officialAddress}
                  onChange={handleChange}
                />
              </label>

              <div className="tenant-grid-two">
                <label
                  className="tenant-label"
                  htmlFor="tenant-companyEmail"
                >
                  <span className="tenant-label-heading">
                    Email <span className="tenant-required">*</span>
                  </span>

                  <input
                    type="email"
                    id="tenant-companyEmail"
                    name="companyEmail"
                    className={`tenant-input${fieldErrors.companyEmail ? " tenant-input-error" : ""
                      }`}
                    value={form.companyEmail}
                    onChange={handleChange}
                  />
                </label>

                <label
                  className="tenant-label"
                  htmlFor="tenant-companyPhone"
                >
                  <span className="tenant-label-heading">
                    Contact No <span className="tenant-required">*</span>
                  </span>
                  <input
                    type="tel"
                    id="tenant-companyPhone"
                    name="companyPhone"
                    className={`tenant-input${fieldErrors.companyPhone ? " tenant-input-error" : ""
                      }`}
                    value={form.companyPhone}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <label className="tenant-label" htmlFor="tenant-gstCertificate">
                <span className="tenant-label-heading">GST Certificate</span>
                <input
                  type="text"
                  id="tenant-gstCertificate"
                  name="gstCertificate"
                  className="tenant-input"
                  value={form.gstCertificate}
                  onChange={handleChange}
                  placeholder="Document reference (optional)"
                />
              </label>

              <div className="tenant-label owner-email">
                <span className="tenant-label-heading">Owner email</span>
                <div className="tenant-owner-email-value">{user?.email}</div>
              </div>
            </div>

            <div className="tenant-logo-panel">
              <label
                className={`tenant-logo-box${logoHover ? " tenant-logo-box-hover" : ""}`}
                htmlFor="tenant-companyLogo"
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
              >
                {logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Company Logo Preview"
                      className="tenant-logo-preview"
                    />
                    <div className="tenant-logo-overlay">
                      <span className="tenant-logo-overlay-text">Change</span>
                    </div>
                  </>
                ) : (
                  <div className="tenant-logo-placeholder">
                    <CiCamera className="tenant-logo-camera-icon"/>
                    <span>Company Logo</span>
                    <span className="tenant-logo-hint-text">click to upload</span>
                  </div>
                )}
              </label>
              <input
                id="tenant-companyLogo"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                className="tenant-logo-input"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          <div className="tenant-actions">
            <button
              type="button"
              className="btn tenant-btn-draft"
              onClick={saveDraft}
              disabled={submitting}
            >
              Save as draft
            </button>

            <button
              type="submit"
              className="btn tenant-btn-submit"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTenantModal;
