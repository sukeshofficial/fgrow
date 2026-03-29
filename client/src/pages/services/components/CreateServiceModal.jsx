import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import logger from "../../../utils/logger.js";

const CreateServiceModal = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sac_code: "",
    gst_rate: 18,
    default_billing_rate: 0,
    is_recurring: false,
    billable_by_default: true,
    is_enabled: true
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        name: "",
        description: "",
        sac_code: "",
        gst_rate: 18,
        default_billing_rate: 0,
        is_recurring: false,
        billable_by_default: true,
        is_enabled: true
      });
      onClose();
    } catch (error) {
      logger.error("CreateServiceModal", "Error creating service", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Service</h2>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Service Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. GST Filing"
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Service details..."
                />
              </div>

              <div className="form-group">
                <label>SAC Code</label>
                <input
                  type="text"
                  name="sac_code"
                  value={formData.sac_code}
                  onChange={handleChange}
                  pattern="[0-9]{6}"
                  title="SAC code must be 6 digits"
                  placeholder="998311"
                />
              </div>

              <div className="form-group">
                <label>GST Rate (%)</label>
                <select name="gst_rate" value={formData.gst_rate} onChange={handleChange}>
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default Billing Rate (₹)</label>
                <input
                  type="number"
                  name="default_billing_rate"
                  value={formData.default_billing_rate}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleChange}
                  />
                  <label htmlFor="is_recurring" style={{ marginBottom: 0 }}>Recurring Service</label>
                </div>
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="billable_by_default"
                    name="billable_by_default"
                    checked={formData.billable_by_default}
                    onChange={handleChange}
                  />
                  <label htmlFor="billable_by_default" style={{ marginBottom: 0 }}>Billable by Default</label>
                </div>
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="is_enabled"
                    name="is_enabled"
                    checked={formData.is_enabled}
                    onChange={handleChange}
                  />
                  <label htmlFor="is_enabled" style={{ marginBottom: 0 }}>Auto Enable</label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServiceModal;
