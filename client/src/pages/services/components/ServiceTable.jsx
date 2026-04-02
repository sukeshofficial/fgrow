import React from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import TableSkeleton from "../../../components/skeletons/TableSkeleton";
import "./ServiceTable.css";

const ServiceTable = ({ services, loading, onDelete, onToggleStatus }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="table-container" style={{ padding: '20px 0' }}>
        <TableSkeleton rows={5} columns={7} />
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  return (
    <div className="service-table-wrapper">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Service Name</th>
            <th>SAC Code</th>
            <th>GST Rate</th>
            <th>Billing Rate</th>
            <th>Type</th>
            <th>Status</th>
            <th style={{ textAlign: 'right', paddingRight: '40px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.length > 0 ? (
            services.map((service) => (
              <tr key={service._id}>
                <td>
                  <div className="service-info">
                    <span className="service-name" style={{ fontWeight: 600, color: '#1e293b' }}>{service.name}</span>
                  </div>
                </td>
                <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{service.sac_code || "-"}</code></td>
                <td>{service.gst_rate}%</td>
                <td>{formatCurrency(service.default_billing_rate)}</td>
                <td>
                  <span className={`status-badge ${service.is_recurring ? "paid" : "sent"}`} style={{
                    background: service.is_recurring ? "#ecfdf5" : "#eff6ff",
                    color: service.is_recurring ? "#065f46" : "#1e40af"
                  }}>
                    {service.is_recurring ? "Recurring" : "One-time"}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${service.is_enabled ? "active" : "inactive"}`}>
                    {service.is_enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td>
                  <div className="service-actions-cell" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="service-action-btn btn-edit-service"
                      title="Edit Service"
                      onClick={() => navigate(`/services/edit/${service._id}`)}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      className={`service-action-btn ${service.is_enabled ? 'btn-toggle-disable' : 'btn-toggle-enable'}`}
                      title={service.is_enabled ? "Disable Service" : "Enable Service"}
                      onClick={() => onToggleStatus(service)}
                    >
                      {service.is_enabled ? <FaToggleOn /> : <FaToggleOff />}
                      {service.is_enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      className="service-action-btn btn-delete-service"
                      title="Archive Service"
                      onClick={() => onDelete(service._id)}
                    >
                      <FaTrash /> Delete
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
    </div>
  );
};

export default ServiceTable;
