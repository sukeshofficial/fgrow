import React, { useState } from "react";
import { FaClipboardList, FaArrowRight } from "react-icons/fa";

const TaskBasicInfoForm = ({ data, onPrev, onNext }) => {
  const [formData, setFormData] = useState({
    title: data.title || "",
    description: data.description || "",
    priority: data.priority || "medium",
    due_date: data.due_date || "",
    is_billable: data.is_billable || false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.title) newErrors.title = "Title is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="step-container">
      <h2 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: 'var(--primary-accent)', fontSize: '22px', display: 'flex' }}><FaClipboardList /></span>
        Basic Task Information
      </h2>

      <div className="form-field">
        <label className="form-label">Task Title <span className="required-star">*</span></label>
        <input
          type="text"
          name="title"
          className={`form-input ${errors.title ? "has-error" : ""}`}
          placeholder="What needs to be done?"
          value={formData.title}
          onChange={handleChange}
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      <div className="form-field">
        <label className="form-label">Description</label>
        <textarea
          name="description"
          className="form-input"
          style={{ height: '100px', padding: '12px' }}
          placeholder="Provide some details..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">Priority</label>
          <select
            name="priority"
            className="form-input"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">Due Date</label>
          <input
            type="date"
            name="due_date"
            className="form-input"
            value={formData.due_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          name="is_billable"
          id="is_billable"
          checked={formData.is_billable}
          onChange={handleChange}
        />
        <label htmlFor="is_billable" className="form-label" style={{ marginBottom: 0 }}>This task is billable</label>
      </div>

      <div className="wizard-footer">
        <button type="button" className="back-btn" onClick={onPrev}>
          Back
        </button>
        <button type="submit" className="next-button" style={{ position: 'static', marginLeft: 'auto', }}>
          Next: Links & Assignment <FaArrowRight size={12} />
        </button>
      </div>
    </form>
  );
};

export default TaskBasicInfoForm;
