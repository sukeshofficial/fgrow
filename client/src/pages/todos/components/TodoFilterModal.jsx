import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import FormField from "../../../components/ui/FormField";

const TodoFilterModal = ({ isOpen, onClose, filters, onApply, onClear, clients, services, staff }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  return (
    <div className="filter-modal-overlay">
      <div className="modal-content advanced-filter-modal">
        <div className="modal-header">
          <h3>Filters</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="filter-grid">
            <FormField label="Assigned To">
              <SearchableDropdown 
                options={staff}
                value={localFilters.user}
                onChange={(val) => setLocalFilters({...localFilters, user: val})}
                placeholder="Select Staff"
              />
            </FormField>

            <FormField label="Priority">
              <select 
                className="form-input" 
                value={localFilters.priority || ""} 
                onChange={(e) => setLocalFilters({...localFilters, priority: e.target.value})}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </FormField>

            <FormField label="Client">
              <SearchableDropdown 
                options={clients}
                value={localFilters.client}
                onChange={(val) => setLocalFilters({...localFilters, client: val})}
                placeholder="Select Client"
              />
            </FormField>

            <FormField label="Service">
              <SearchableDropdown 
                options={services}
                value={localFilters.service}
                onChange={(val) => setLocalFilters({...localFilters, service: val})}
                placeholder="Select Service"
              />
            </FormField>

            <FormField label="Due From">
              <input 
                type="date" 
                className="form-input" 
                value={localFilters.due_from || ""}
                onChange={(e) => setLocalFilters({...localFilters, due_from: e.target.value})}
              />
            </FormField>

            <FormField label="Due To">
              <input 
                type="date" 
                className="form-input" 
                value={localFilters.due_to || ""}
                onChange={(e) => setLocalFilters({...localFilters, due_to: e.target.value})}
              />
            </FormField>
          </div>
        </div>

        <div className="modal-footer">
          <button className="clear-link" onClick={() => { onClear(); onClose(); }}>Clear All</button>
          <div className="footer-actions">
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
            <button className="apply-btn" onClick={() => { onApply(localFilters); onClose(); }}>Apply Filters</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .filter-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .advanced-filter-modal {
          background: white;
          width: 500px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 { margin: 0; font-size: 18px; color: var(--text-main); }
        .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b; }
        .modal-body { padding: 20px; overflow-y: auto; max-height: 70vh; }
        .filter-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .clear-link { background: none; border: none; color: #ef4444; font-weight: 500; cursor: pointer; }
        .footer-actions { display: flex; gap: 12px; }
        .cancel-btn { background: #f1f5f9; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; color: var(--text-main); }
        .apply-btn { background: var(--primary-accent, #2563eb); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; }
        .form-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default TodoFilterModal;
