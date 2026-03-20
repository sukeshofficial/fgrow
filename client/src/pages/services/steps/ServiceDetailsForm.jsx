import React, { useState } from "react";
import FormField from "../../../components/ui/FormField";

const ServiceDetailsForm = ({ data, onNext, onPrev }) => {
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
        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <FormField label="Service Name" required>
            <input 
              type="text" 
              name="name"
              className="form-input"
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g. GST Filing"
            />
          </FormField>
          
          <FormField label="Description">
            <textarea 
              name="description" 
              className="form-input"
              style={{ height: '100px', paddingTop: '12px' }}
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Brief description of the service..."
            />
          </FormField>

          <FormField label="SAC Code">
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
          </FormField>
        </div>

        <div className="wizard-footer">
          <button type="button" className="back-btn" onClick={onPrev}>
            Back
          </button>
          <button type="submit" className="next-button" style={{ position: 'static' }}>
            Continue to Billing
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceDetailsForm;
