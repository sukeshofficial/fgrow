import React, { useState, useEffect } from "react";
import { listClientsByTenantId } from "../../../api/client.api";
import { listServicesByTenant } from "../../../api/service.api";

const TaskAdvancedFilterModal = ({ isOpen, onClose, filters, onApply, onClear }) => {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [clientsResp, servicesResp] = await Promise.all([
            listClientsByTenantId({ limit: 100 }),
            listServicesByTenant()
          ]);
          if (clientsResp.data.success) setClients(clientsResp.data.data.items || clientsResp.data.data);
          if (servicesResp.data.success) setServices(servicesResp.data.data.items || servicesResp.data.data);
        } catch (err) {
          console.error("Failed to fetch filter options", err);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content advanced-filter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Advanced Filters</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="filter-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Priority</label>
              <select 
                value={filters.priority || ""} 
                onChange={(e) => onApply({ ...filters, priority: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              >
                <option value="">Any Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="filter-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Status</label>
              <select 
                value={filters.status || "all"} 
                onChange={(e) => onApply({ ...filters, status: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              >
                <option value="all">Any Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Client</label>
              <select 
                value={filters.client || ""} 
                onChange={(e) => onApply({ ...filters, client: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              >
                <option value="">Any Client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="filter-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Service</label>
              <select 
                value={filters.service || ""} 
                onChange={(e) => onApply({ ...filters, service: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              >
                <option value="">Any Service</option>
                {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            <div className="filter-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Date From</label>
              <input 
                type="date"
                value={filters.dateFrom || ""} 
                onChange={(e) => onApply({ ...filters, dateFrom: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div className="filter-field">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Date To</label>
              <input 
                type="date"
                value={filters.dateTo || ""} 
                onChange={(e) => onApply({ ...filters, dateTo: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="clear-btn" onClick={() => { onClear(); onClose(); }}>Clear All</button>
          <button className="apply-btn" onClick={onClose}>Apply Filters</button>
        </div>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h2 { margin: 0; font-size: 18px; }
        .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-muted); }
        .modal-body { padding: 24px; }
        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .clear-btn { background: none; border: none; color: var(--error-red); cursor: pointer; font-weight: 600; margin-right: auto;}
        .apply-btn {
          background: var(--primary-accent);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default TaskAdvancedFilterModal;
