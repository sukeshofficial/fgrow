import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import FormField from "../../../components/ui/FormField";
import { listClientGroups, listTags } from "../../../api/client.api";

const AdvancedFilterModal = ({ isOpen, onClose, filters, onApply, onClear }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      fetchTags();
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const fetchGroups = async () => {
    try {
      const resp = await listClientGroups();
      setGroups(resp.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTags = async () => {
    try {
      const resp = await listTags();
      setTags(resp.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content advanced-filter-modal">
        <div className="modal-header">
          <h3>Advanced Filters</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="filter-grid">
            <FormField label="Client Type">
              <select 
                className="form-input" 
                value={localFilters.type || ""} 
                onChange={(e) => setLocalFilters({...localFilters, type: e.target.value})}
              >
                <option value="">All Types</option>
                <option value="Individual">Individual</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="LLP">LLP</option>
                <option value="Private Limited">Private Limited</option>
                <option value="Limited Company">Limited Company</option>
              </select>
            </FormField>

            <FormField label="Client Group">
              <SearchableDropdown 
                options={groups}
                value={localFilters.group}
                onChange={(val) => setLocalFilters({...localFilters, group: val})}
                placeholder="Select Group"
              />
            </FormField>

            <FormField label="Tags">
              <SearchableDropdown 
                isMulti
                options={tags}
                value={localFilters.tags}
                onChange={(val) => setLocalFilters({...localFilters, tags: val})}
                placeholder="Select Tags"
              />
            </FormField>

            <FormField label="PAN">
              <input 
                type="text" 
                className="form-input" 
                placeholder="Filter by PAN"
                value={localFilters.pan || ""}
                onChange={(e) => setLocalFilters({...localFilters, pan: e.target.value.toUpperCase()})}
              />
            </FormField>

            <FormField label="GSTIN">
              <input 
                type="text" 
                className="form-input" 
                placeholder="Filter by GSTIN"
                value={localFilters.gstin || ""}
                onChange={(e) => setLocalFilters({...localFilters, gstin: e.target.value.toUpperCase()})}
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
        .modal-overlay {
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
        .modal-header h3 { margin: 0; font-size: 18px; }
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
        .cancel-btn { background: #f1f5f9; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; }
        .apply-btn { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdvancedFilterModal;
