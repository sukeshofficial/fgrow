import React from "react";
import { useNavigate } from "react-router-dom";

const ClientTable = ({ clients, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-shimmer" style={{ height: '400px' }}></div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Type</th>
            <th>Group</th>
            <th>PAN / GSTIN</th>
            <th>Primary Contact</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.length > 0 ? (
            clients.map((client) => (
              <tr key={client._id}>
                <td>
                  <div className="client-info">
                    <div className="client-avatar">
                      {client.photo?.secure_url ? (
                        <img src={client.photo.secure_url} alt={client.name} />
                      ) : (
                        client.name.charAt(0)
                      )}
                    </div>
                    <span className="client-name">{client.name}</span>
                  </div>
                </td>
                <td>{client.type}</td>
                <td>{client.group?.name || "-"}</td>
                <td>
                  <div style={{ fontSize: '12px' }}>
                    <div>{client.pan}</div>
                    <div style={{ color: '#94a3b8' }}>{client.gstin || "-"}</div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '13px' }}>
                    <div>{client.primary_contact_name || "-"}</div>
                    <div style={{ color: '#94a3b8' }}>{client.primary_contact_mobile || "-"}</div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${client.is_active ? "active" : "inactive"}`}>
                    {client.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button className="action-btn" onClick={() => navigate(`/clients/${client._id}`)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                No clients found.
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

export default ClientTable;
