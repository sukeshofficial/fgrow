import React, { useState } from "react";

const ServiceDetailsForm = ({ data, onNext }) => {
  const [formData, setFormData] = useState({
    name: data.name || "",
    description: data.description || "",
    sac_code: data.sac_code || ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <div className="step-container">
      <h2 className="form-title">Service Details</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Service Name <span className="required-star">*</span></label>
            <input 
              type="text" 
              name="name" 
              className="form-input"
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g. GST Filing"
            />
          </div>
          
          <div className="form-field" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Description</label>
            <textarea 
              name="description" 
              className="form-input"
              style={{ height: '80px', paddingTop: '8px' }}
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Brief description of the service..."
            />
          </div>

          <div className="form-field">
            <label className="form-label">SAC Code</label>
            <input 
              type="text" 
              name="sac_code" 
              className="form-input"
              value={formData.sac_code} 
              onChange={handleChange} 
              pattern="[0-9]{6}"
              title="SAC code must be 6 digits"
              placeholder="998311"
            />
          </div>
        </div>

        <div className="wizard-footer" style={{ justifyContent: 'flex-end' }}>
          <button type="submit" className="next-button" style={{ position: 'static' }}>
            Continue to Billing
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceDetailsForm;
