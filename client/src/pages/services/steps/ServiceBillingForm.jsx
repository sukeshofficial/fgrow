import React, { useState } from "react";

const ServiceBillingForm = ({ data, onNext, onPrev }) => {
  const [formData, setFormData] = useState({
    gst_rate: data.gst_rate || 18,
    default_billing_rate: data.default_billing_rate || 0,
    is_recurring: data.is_recurring || false,
    billable_by_default: data.billable_by_default !== undefined ? data.billable_by_default : true,
    is_enabled: data.is_enabled !== undefined ? data.is_enabled : true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <div className="step-container">
      <h2 className="form-title">Billing & Configuration</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">GST Rate (%)</label>
            <select name="gst_rate" className="form-input" value={formData.gst_rate} onChange={handleChange}>
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
              <option value={28}>28%</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Default Billing Rate (₹)</label>
            <input 
              type="number" 
              name="default_billing_rate" 
              className="form-input"
              value={formData.default_billing_rate} 
              onChange={handleChange} 
              min="0"
            />
          </div>

          <div className="form-field" style={{ gridColumn: 'span 2' }}>
            <div className="checkbox-stack" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  name="is_recurring" 
                  checked={formData.is_recurring} 
                  onChange={handleChange} 
                />
                <div className="custom-checkbox"></div>
                <span className="checkbox-label">This is a recurring service</span>
              </label>

              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  name="billable_by_default" 
                  checked={formData.billable_by_default} 
                  onChange={handleChange} 
                />
                <div className="custom-checkbox"></div>
                <span className="checkbox-label">Billable by default</span>
              </label>

              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  name="is_enabled" 
                  checked={formData.is_enabled} 
                  onChange={handleChange} 
                />
                <div className="custom-checkbox"></div>
                <span className="checkbox-label">Immediately enable this service</span>
              </label>
            </div>
          </div>
        </div>

        <div className="wizard-footer">
          <button type="button" className="back-btn" onClick={onPrev}>
            Back
          </button>
          
          <button type="submit" className="next-button" style={{ position: 'static' }}>
            Review Summary
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceBillingForm;
