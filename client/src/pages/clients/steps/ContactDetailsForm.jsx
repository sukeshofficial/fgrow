import React, { useState, useEffect } from "react";
import FormField from "../../../components/ui/FormField";
import { FiPlus, FiTrash2, FiUser, FiCheck } from "react-icons/fi";

const ContactDetailsForm = ({ data, onNext, onPrev, isTransitioning }) => {
  const [contacts, setContacts] = useState(data.contacts || []);
  const [currentContact, setCurrentContact] = useState({
    name: "",
    role: "",
    email: "",
    mobile: "",
    secondary_mobile: "",
    dob: "",
    is_primary: contacts.length === 0 // Default true if first contact
  });
  const [address, setAddress] = useState(data.address || {
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India"
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (data.contacts) setContacts(data.contacts);
    if (data.address) setAddress(data.address);
  }, [data]);

  const handleContactChange = (key, value) => {
    setCurrentContact(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleAddressChange = (key, value) => {
    setAddress(prev => ({ ...prev, [key]: value }));
  };

  const addContact = () => {
    // Basic validation for the new contact
    const newErrors = {};
    if (!currentContact.name) newErrors.name = "Name is required";
    if (!currentContact.mobile) newErrors.mobile = "Mobile is required";
    if (!currentContact.email) newErrors.email = "Email is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let updatedContacts = [...contacts];

    // If this new contact is primary, unset others
    if (currentContact.is_primary) {
      updatedContacts = updatedContacts.map(c => ({ ...c, is_primary: false }));
    }

    updatedContacts.push(currentContact);
    setContacts(updatedContacts);

    // Reset current contact form
    setCurrentContact({
      name: "",
      role: "",
      email: "",
      mobile: "",
      secondary_mobile: "",
      dob: "",
      is_primary: false
    });
  };

  const removeContact = (index) => {
    const updated = contacts.filter((_, i) => i !== index);
    // If we removed the primary, make the first one primary if exists
    if (contacts[index].is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    setContacts(updated);
  };

  const setAsPrimary = (index) => {
    const updated = contacts.map((c, i) => ({
      ...c,
      is_primary: i === index
    }));
    setContacts(updated);
  };

  const handleNext = () => {
    // If there's partial data in currentContact and no contacts added, try to add it
    if (!contacts.length && currentContact.name) {
      addContact();
      return; // Wait for state update or just proceed with manual calculation
    }

    if (contacts.length === 0) {
      alert("Please add at least one contact");
      return;
    }

    const primary = contacts.find(c => c.is_primary) || contacts[0];

    const finalData = {
      contacts: contacts,
      address: address,
      primary_contact_name: primary.name,
      primary_contact_mobile: primary.mobile,
      primary_contact_email: primary.email,
      primary_contact_role: primary.role
    };

    onNext(finalData);
  };

  return (
    <div className={`step-container ${isTransitioning ? "slide-down-active" : ""}`}>
      <h2 className="form-title">Contact Details</h2>

      <div className="form-layout" style={{ flexDirection: 'column', gap: '32px' }}>

        {/* Contacts List Section */}
        {contacts.length > 0 && (
          <div className="contacts-list-section">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-main)' }}>Added Contacts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {contacts.map((c, idx) => (
                <div key={idx} className={`contact-card ${c.is_primary ? 'primary-contact' : ''}`} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: c.is_primary ? '#f8faff' : 'white',
                  position: 'relative',
                  borderColor: c.is_primary ? 'var(--primary-blue)' : '#e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <FiUser />
                      <span style={{ fontWeight: '600' }}>{c.name}</span>
                      {c.is_primary && <span className="primary-pill">Primary</span>}
                    </div>
                    <button className="icon-btn danger" onClick={() => removeContact(idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                      <FiTrash2 />
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                    <div>{c.role || 'No Role'}</div>
                    <div>{c.email}</div>
                    <div>{c.mobile}</div>
                  </div>
                  {!c.is_primary && (
                    <button
                      className="link-btn"
                      onClick={() => setAsPrimary(idx)}
                      style={{ marginTop: '12px', fontSize: '12px', color: 'var(--primary-blue)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Make Primary
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Contact Section */}
        <div className="add-contact-section" style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Add New Contact</h3>
          </div>

          <div className="form-grid">
            <FormField label="Full Name" required error={errors.name}>
              <input
                type="text"
                className="form-input"
                value={currentContact.name}
                onChange={(e) => handleContactChange("name", e.target.value)}
                placeholder="e.g. John Doe"
              />
            </FormField>

            <FormField label="Email Address" required error={errors.email}>
              <input
                type="email"
                className="form-input"
                value={currentContact.email}
                onChange={(e) => handleContactChange("email", e.target.value)}
                placeholder="john@example.com"
              />
            </FormField>

            <FormField label="Mobile Number" required error={errors.mobile}>
              <input
                type="text"
                className="form-input"
                value={currentContact.mobile}
                onChange={(e) => handleContactChange("mobile", e.target.value)}
                placeholder="+91 9876543210"
              />
            </FormField>

            <FormField label="Secondary Mobile">
              <input
                type="text"
                className="form-input"
                value={currentContact.secondary_mobile}
                onChange={(e) => handleContactChange("secondary_mobile", e.target.value)}
                placeholder="Alternative number"
              />
            </FormField>

            <FormField label="Role / Designation">
              <input
                type="text"
                className="form-input"
                value={currentContact.role}
                onChange={(e) => handleContactChange("role", e.target.value)}
                placeholder="e.g. CEO, Director"
              />
            </FormField>

            <FormField label="Date of Birth">
              <input
                type="date"
                className="form-input"
                value={currentContact.dob}
                onChange={(e) => handleContactChange("dob", e.target.value)}
              />
            </FormField>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="is_primary"
              checked={currentContact.is_primary}
              onChange={(e) => handleContactChange("is_primary", e.target.checked)}
              style={{ padding: '0px' }}
            />
            <label htmlFor="is_primary" style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Set as Primary Contact?</label>
          </div>

          <button
            type="button"
            className="btn ghost"
            style={{ marginTop: '24px', width: '100%', borderStyle: 'dashed', borderColor: '#cbd5e1', color: '#475569' }}
            onClick={addContact}
          >
            <FiPlus /> Add Contact to List
          </button>
        </div>

        {/* Address Info Section */}
        <div className="address-section">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-main)' }}>Address Information</h3>
          <div className="form-grid">
            <FormField label="Street Address">
              <input
                type="text"
                className="form-input"
                value={address.street || ""}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                placeholder="123 Main St"
              />
            </FormField>

            <FormField label="City">
              <input
                type="text"
                className="form-input"
                value={address.city || ""}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                placeholder="Mumbai"
              />
            </FormField>

            <FormField label="State">
              <input
                type="text"
                className="form-input"
                value={address.state || ""}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                placeholder="Maharashtra"
              />
            </FormField>

            <FormField label="Postal Code">
              <input
                type="text"
                className="form-input"
                value={address.postalCode || ""}
                onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                placeholder="400001"
              />
            </FormField>
          </div>
        </div>
      </div>

      <div className="wizard-footer">
        <button
          type="button"
          className="back-btn"
          onClick={onPrev}
        >
          Back
        </button>
        <button
          className="next-button"
          style={{ position: 'static' }}
          onClick={handleNext}
        >
          {contacts.length === 0 && currentContact.name ? "Add & Continue" : "Next Step"}
        </button>
      </div>

      <style>{`
        .primary-pill {
          background: #e0e7ff;
          color: #4338ca;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .contact-card.primary-contact {
          box-shadow: 0 4px 12px rgba(67, 56, 202, 0.08);
        }
      `}</style>
    </div>
  );
};

export default ContactDetailsForm;
