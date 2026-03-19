import { useState } from "react";
import { FaTimes, FaRedo } from "react-icons/fa";
import { Button } from "../ui/Button";
import "../../styles/rejection-modal.css";
import "../../styles/reappeal-modal.css";

const ReAppealModal = ({ tenant, onConfirm, onCancel, submitting }) => {
  const [form, setForm] = useState({
    name: tenant?.name || "",
    companyEmail: tenant?.companyEmail || "",
    companyPhone: tenant?.companyPhone || "",
    gstNumber: tenant?.gstNumber || "",
    registrationNumber: tenant?.registrationNumber || "",
    timezone: tenant?.timezone || "Asia/Kolkata",
    currency: tenant?.currency || "INR",
    // Address fields
    street: tenant?.companyAddress?.street || "",
    city: tenant?.companyAddress?.city || "",
    state: tenant?.companyAddress?.state || "",
    postalCode: tenant?.companyAddress?.postalCode || "",
    country: tenant?.companyAddress?.country || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.companyEmail) return;

    // Shape the payload to match backend expectations
    onConfirm({
      name: form.name,
      companyEmail: form.companyEmail,
      companyPhone: form.companyPhone,
      gstNumber: form.gstNumber,
      registrationNumber: form.registrationNumber,
      timezone: form.timezone,
      currency: form.currency,
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
    <div className="tenant-modal-overlay" aria-modal="true" role="dialog">
      <div className="tenant-modal reappeal-modal-wide">
        <button className="tenant-modal-close" onClick={onCancel} aria-label="Close">
          <FaTimes />
        </button>

        <div className="reappeal-modal-header">
          <div className="reappeal-icon-wrap">
            <FaRedo />
          </div>
          <h2 className="tenant-modal-title">Submit Re-appeal</h2>
          <p className="tenant-modal-subtitle">
            Review and update your organization details before resubmitting.
          </p>
        </div>

        {tenant?.rejection_reason && (
          <div className="reappeal-rejection-banner">
            <span className="reappeal-rejection-label">Previous Rejection Reason</span>
            <p className="reappeal-rejection-text">{tenant.rejection_reason}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="reappeal-form">
          {/* ── Section: Company Info ── */}
          <p className="reappeal-section-title">Company Information</p>
          <div className="reappeal-grid-two">
            <div className="reappeal-field">
              <label htmlFor="ra-name" className="tenant-label">
                <span className="tenant-label-heading">
                  Company Name <span className="tenant-required">*</span>
                </span>
                <input
                  type="text"
                  id="ra-name"
                  name="name"
                  className="tenant-input reappeal-input"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your company name"
                />
              </label>
            </div>

            <div className="reappeal-field">
              <label htmlFor="ra-email" className="tenant-label">
                <span className="tenant-label-heading">
                  Company Email <span className="tenant-required">*</span>
                </span>
                <input
                  type="email"
                  id="ra-email"
                  name="companyEmail"
                  className="tenant-input reappeal-input"
                  value={form.companyEmail}
                  onChange={handleChange}
                  required
                  placeholder="contact@company.com"
                />
              </label>
            </div>

            <div className="reappeal-field">
              <label htmlFor="ra-phone" className="tenant-label">
                <span className="tenant-label-heading">Contact No</span>
                <input
                  type="tel"
                  id="ra-phone"
                  name="companyPhone"
                  className="tenant-input reappeal-input"
                  value={form.companyPhone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </label>
            </div>

            <div className="reappeal-field">
              <label htmlFor="ra-gst" className="tenant-label">
                <span className="tenant-label-heading">GSTIN</span>
                <input
                  type="text"
                  id="ra-gst"
                  name="gstNumber"
                  className="tenant-input reappeal-input"
                  value={form.gstNumber}
                  onChange={handleChange}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  maxLength={15}
                  style={{ textTransform: "uppercase" }}
                />
              </label>
            </div>

            <div className="reappeal-field">
              <label htmlFor="ra-regno" className="tenant-label">
                <span className="tenant-label-heading">Registration Number</span>
                <input
                  type="text"
                  id="ra-regno"
                  name="registrationNumber"
                  className="tenant-input reappeal-input"
                  value={form.registrationNumber}
                  onChange={handleChange}
                  placeholder="Company registration number"
                />
              </label>
            </div>

            <div className="reappeal-field">
              <label htmlFor="ra-timezone" className="tenant-label">
                <span className="tenant-label-heading">Timezone</span>
                <input
                  type="text"
                  id="ra-timezone"
                  name="timezone"
                  className="tenant-input reappeal-input"
                  value={form.timezone}
                  onChange={handleChange}
                  placeholder="Asia/Kolkata"
                />
              </label>
            </div>

            <div className="reappeal-field">
              <label htmlFor="ra-currency" className="tenant-label">
                <span className="tenant-label-heading">Currency</span>
                <select
                  id="ra-currency"
                  name="currency"
                  className="tenant-input reappeal-input"
                  value={form.currency}
                  onChange={handleChange}
                >
                  <option value="INR">INR – Indian Rupee</option>
                  <option value="USD">USD – US Dollar</option>
                  <option value="EUR">EUR – Euro</option>
                  <option value="GBP">GBP – British Pound</option>
                  <option value="AED">AED – UAE Dirham</option>
                  <option value="SGD">SGD – Singapore Dollar</option>
                </select>
              </label>
            </div>
          </div>

          {/* ── Section: Address ── */}
          <p className="reappeal-section-title" style={{ marginTop: "1.5rem" }}>
            Company Address
          </p>
          <div className="reappeal-grid-two">
            <div className="reappeal-field reappeal-full">
              <label htmlFor="ra-street" className="tenant-label">
                <span className="tenant-label-heading">Street</span>
                <input
                  type="text"
                  id="ra-street"
                  name="street"
                  className="tenant-input reappeal-input"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="123 Business Park, MG Road"
                />
              </label>
            </div>

            <div className="reappeal-field">
              <label htmlFor="ra-city" className="tenant-label">
                <span className="tenant-label-heading">City</span>
                <input
                  type="text"
                  id="ra-city"
                  name="city"
                  className="tenant-input reappeal-input"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Chennai"
                />
              </label>
            </div>

            <div className="reappeal-field">
              <label htmlFor="ra-state" className="tenant-label">
                <span className="tenant-label-heading">State</span>
                <input
                  type="text"
                  id="ra-state"
                  name="state"
                  className="tenant-input reappeal-input"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Tamil Nadu"
                />
              </label>
            </div>

            <div className="reappeal-field">
              <label htmlFor="ra-postal" className="tenant-label">
                <span className="tenant-label-heading">Postal Code</span>
                <input
                  type="text"
                  id="ra-postal"
                  name="postalCode"
                  className="tenant-input reappeal-input"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="600001"
                />
              </label>
            </div>

            <div className="reappeal-field">
              <label htmlFor="ra-country" className="tenant-label">
                <span className="tenant-label-heading">Country</span>
                <input
                  type="text"
                  id="ra-country"
                  name="country"
                  className="tenant-input reappeal-input"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="India"
                />
              </label>
            </div>
          </div>

          <div className="reappeal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={submitting}
              className="rejection-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !form.name || !form.companyEmail}
              className="rejection-confirm-btn"
              style={{ backgroundColor: "#7c3aed" }}
            >
              {submitting ? "Submitting..." : "Submit Appeal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReAppealModal;
