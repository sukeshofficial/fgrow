import React from "react";
import { useNavigate } from "react-router-dom";

const ServiceTable = ({ services, loading, onDelete, onToggleStatus }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-shimmer" style={{ height: "400px" }}></div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Service Name</th>
            <th>SAC Code</th>
            <th>GST Rate</th>
            <th>Billing Rate</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.length > 0 ? (
            services.map((service) => (
              <tr key={service._id}>
                <td>
                  <div className="service-info">
                    <span className="service-name">{service.name}</span>
                  </div>
                </td>
                <td>{service.sac_code || "-"}</td>
                <td>{service.gst_rate}%</td>
                <td>₹{service.default_billing_rate?.toLocaleString() || 0}</td>
                <td>
                  <span className={`status-badge ${service.is_recurring ? "active" : "inactive"}`} style={{ background: service.is_recurring ? "#ecfdf5" : "#fef3c7", color: service.is_recurring ? "#059669" : "#d97706" }}>
                    {service.is_recurring ? "Recurring" : "One-time"}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${service.is_enabled ? "active" : "inactive"}`}>
                    {service.is_enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="action-btn" onClick={() => navigate(`/services/edit/${service._id}`)}>
                      Edit
                    </button>
                    <button className="action-btn" onClick={() => onToggleStatus(service)}>
                      {service.is_enabled ? "Disable" : "Enable"}
                    </button>
                    <button className="action-btn" onClick={() => onDelete(service._id)} style={{ color: '#ef4444' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                No services found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <style>{`
        .action-btn {
          border: 1px solid #e2e8f0;
          background: white;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }
        .action-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default ServiceTable;
