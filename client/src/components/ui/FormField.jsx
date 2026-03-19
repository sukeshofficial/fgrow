import React from "react";

const FormField = ({ label, required, error, children, helpText }) => {
  return (
    <div className={`form-field ${error ? "has-error" : ""}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      <div className="field-control">
        {children}
      </div>
      {error && <span className="error-message">{error}</span>}
      {!error && helpText && <span className="help-text">{helpText}</span>}

      <style jsx>{`
        .help-text {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default FormField;
