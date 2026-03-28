import React, { useState, useEffect } from "react";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import FormField from "../../../components/ui/FormField";
import { listClientGroups, listTags } from "../../../api/client.api";
import { FiX, FiFilter } from "react-icons/fi";
import "../../../styles/AdvancedFilters.css";

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
    <div className="filter-modal-overlay">
      <div className="filter-modal-container" style={{ maxWidth: '500px' }}>
        <div className="filter-modal-header">
          <h3><FiFilter style={{ marginRight: '8px' }} /> Advanced Filters</h3>
          <button className="filter-close-btn" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="filter-modal-body">
          <div className="filter-grid-layout">
            <div className="filter-field-group">
              <label className="filter-field-label">Client Type</label>
              <select
                className="filter-input-styled"
                value={localFilters.type || ""}
                onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="Individual">Individual</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="LLP">LLP</option>
                <option value="Private Limited">Private Limited</option>
                <option value="Limited Company">Limited Company</option>
              </select>
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Client Group</label>
              <SearchableDropdown
                options={groups}
                value={localFilters.group}
                onChange={(val) => setLocalFilters({ ...localFilters, group: val })}
                placeholder="Select Group"
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">Tags</label>
              <SearchableDropdown
                isMulti
                options={tags}
                value={localFilters.tags}
                onChange={(val) => setLocalFilters({ ...localFilters, tags: val })}
                placeholder="Select Tags"
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">PAN</label>
              <input
                type="text"
                className="filter-input-styled"
                placeholder="Filter by PAN"
                value={localFilters.pan || ""}
                onChange={(e) => setLocalFilters({ ...localFilters, pan: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="filter-field-group">
              <label className="filter-field-label">GSTIN</label>
              <input
                type="text"
                className="filter-input-styled"
                placeholder="Filter by GSTIN"
                value={localFilters.gstin || ""}
                onChange={(e) => setLocalFilters({ ...localFilters, gstin: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
        </div>

        <div className="filter-modal-footer">
          <button className="filter-clear-all" onClick={() => { onClear(); onClose(); }}>Clear All</button>
          <div className="filter-footer-btns">
            <button className="filter-btn-secondary" onClick={onClose}>Cancel</button>
            <button className="filter-btn-primary" onClick={() => { onApply(localFilters); onClose(); }}>Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilterModal;
