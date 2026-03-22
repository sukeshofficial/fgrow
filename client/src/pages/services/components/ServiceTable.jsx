import React from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { Spinner } from "../../../components/ui/Spinner";

const ServiceTable = ({ services, loading, onDelete, onToggleStatus }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="table-loading" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spinner />
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
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                    <button className="action-btn" title="Edit Service" onClick={() => navigate(`/services/edit/${service._id}`)}>
                      <FaEdit style={{ marginRight: '4px' }} /> Edit
                    </button>
                    <button className="action-btn" title={service.is_enabled ? "Disable Service" : "Enable Service"} onClick={() => onToggleStatus(service)}>
                      {service.is_enabled ? <FaToggleOn style={{ marginRight: '4px', color: '#10b981' }} /> : <FaToggleOff style={{ marginRight: '4px', color: '#94a3b8' }} />}
                      {service.is_enabled ? "Disable" : "Enable"}
                    </button>
                    <button className="action-btn delete-btn" title="Archive Service" onClick={() => onDelete(service._id)}>
                      <FaTrash style={{ marginRight: '4px' }} /> Delete
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
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 70px;
          color: #475569;
        }
        .action-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: var(--primary-accent);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .action-btn.delete-btn {
          color: #ef4444;
          border-color: #fee2e2;
        }
        .action-btn.delete-btn:hover {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default ServiceTable;
