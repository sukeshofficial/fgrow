import React, { useState } from "react";
import FormField from "../../../components/ui/FormField";

const ContactDetailsForm = ({ data, onNext, onPrev, isTransitioning }) => {
  const [form, setForm] = useState(data);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleAddressChange = (key, value) => {
    setForm(prev => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        [key]: value
      }
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.primary_contact_name) newErrors.primary_contact_name = "Primary contact name is required";
    if (!form.primary_contact_email) newErrors.primary_contact_email = "Primary contact email is required";
    if (!form.primary_contact_mobile) newErrors.primary_contact_mobile = "Primary contact mobile is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext(form);
    }
  };

  return (
    <div className={`step-container ${isTransitioning ? "slide-down-active" : ""}`}>
      <h2 className="form-title">Contact Details</h2>
      
      <div className="form-layout" style={{ flexDirection: 'column', gap: '20px' }}>
        <div className="form-grid">
          <FormField label="Contact Person Name" required error={errors.primary_contact_name}>
            <input 
              type="text" 
              className="form-input" 
              value={form.primary_contact_name} 
              onChange={(e) => handleChange("primary_contact_name", e.target.value)} 
              placeholder="e.g. John Doe"
            />
          </FormField>

          <FormField label="Designation / Role">
            <input 
              type="text" 
              className="form-input" 
              value={form.primary_contact_role} 
              onChange={(e) => handleChange("primary_contact_role", e.target.value)} 
              placeholder="e.g. CEO, Manager"
            />
          </FormField>

          <FormField label="Email Address" required error={errors.primary_contact_email}>
            <input 
              type="email" 
              className="form-input" 
              value={form.primary_contact_email} 
              onChange={(e) => handleChange("primary_contact_email", e.target.value)} 
              placeholder="john@example.com"
            />
          </FormField>

          <FormField label="Mobile Number" required error={errors.primary_contact_mobile}>
            <input 
              type="text" 
              className="form-input" 
              value={form.primary_contact_mobile} 
              onChange={(e) => handleChange("primary_contact_mobile", e.target.value)} 
              placeholder="+91 9876543210"
            />
          </FormField>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '10px', color: 'var(--text-main)' }}>Address Information</h3>
        <div className="form-grid">
          <FormField label="Street Address">
            <input 
              type="text" 
              className="form-input" 
              value={form.address?.street || ""} 
              onChange={(e) => handleAddressChange("street", e.target.value)} 
              placeholder="123 Main St"
            />
          </FormField>

          <FormField label="City">
            <input 
              type="text" 
              className="form-input" 
              value={form.address?.city || ""} 
              onChange={(e) => handleAddressChange("city", e.target.value)} 
              placeholder="Mumbai"
            />
          </FormField>

          <FormField label="State">
            <input 
              type="text" 
              className="form-input" 
              value={form.address?.state || ""} 
              onChange={(e) => handleAddressChange("state", e.target.value)} 
              placeholder="Maharashtra"
            />
          </FormField>

          <FormField label="Postal Code">
            <input 
              type="text" 
              className="form-input" 
              value={form.address?.postalCode || ""} 
              onChange={(e) => handleAddressChange("postalCode", e.target.value)} 
              placeholder="400001"
            />
          </FormField>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
        <button 
          className="btn ghost" 
          style={{ height: '44px', padding: '0 24px', borderRadius: '10px' }}
          onClick={onPrev}
        >
          Back
        </button>
        <button 
          className="next-button" 
          style={{ position: 'static' }}
          onClick={handleNext}
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

export default ContactDetailsForm;
