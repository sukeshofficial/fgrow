import React, { useState, Suspense, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import SideBar from "../../components/SideBar";
import { listDsc, createDsc, updateDsc, deleteDsc } from "../../api/dsc.api";
import { listClientsByTenantId } from "../../api/client.api";
import { Eye, Pencil, Trash2, Lock, Copy, Check } from "lucide-react";
import SearchableDropdown from "../../components/ui/SearchableDropdown";
import DscFilterBar from "./components/DscFilterBar";

import "../../styles/Documents.css";
import "../quotations/quotations.css";

const DeleteModal = React.lazy(() => import("../../components/ui/DeleteModal"));

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const DscViewModal = ({ isOpen, onClose, dsc }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (dsc?.password) {
      navigator.clipboard.writeText(dsc.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !dsc) return null;
  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div className="doc-modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="doc-modal-header">
          <h2>DSC Details</h2>
          <button className="doc-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="doc-modal-body">
          <div className="doc-view-grid">
            <div className="doc-view-item">
              <span className="doc-view-label">Client</span>
              <div className="doc-view-value">{dsc.client?.name || "N/A"}</div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Class</span>
              <div className="doc-view-value">{dsc.class_type || "N/A"}</div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Issue Date</span>
              <div className="doc-view-value">{dsc.issue_date ? new Date(dsc.issue_date).toLocaleDateString() : "N/A"}</div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Expiry Date</span>
              <div className="doc-view-value">{dsc.expiry_date ? new Date(dsc.expiry_date).toLocaleDateString() : "N/A"}</div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Password</span>
              <div className="doc-view-value" style={{ fontFamily: "monospace", letterSpacing: "1px" }}>
                <Lock size={16} style={{ marginRight: '8px', color: '#94a3b8' }} />
                <span>{dsc.password || "N/A"}</span>
                {dsc.password && (
                  <button
                    onClick={handleCopy}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', padding: '4px', marginLeft: 'auto', borderRadius: '4px' }}
                    title="Copy Password"
                  >
                    {copied ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} style={{ color: '#94a3b8' }} />}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="doc-view-item no-border" style={{ marginTop: '16px' }}>
            <span className="doc-view-label">Notes</span>
            <div className="doc-view-value" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--primary-accent)' }}>{dsc.notes || "None"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DscModal = ({ isOpen, onClose, dsc, onSave }) => {
  const [formData, setFormData] = useState({
    client: dsc?.client?._id || "",
    class_type: dsc?.class_type || "Class 3",
    password: dsc?.password || "",
    issue_date: dsc?.issue_date ? dsc.issue_date.substring(0, 10) : new Date().toISOString().substring(0, 10),
    expiry_date: dsc?.expiry_date ? dsc.expiry_date.substring(0, 10) : new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().substring(0, 10),
    notes: dsc?.notes || ""
  });

  const { data: clientsData } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await listClientsByTenantId({ limit: 1000 });
      return res.data.data.items || res.data.data || [];
    }
  });

  const handleSave = () => {
    if (!formData.client || !formData.class_type || !formData.issue_date || !formData.expiry_date) {
      alert("Please fill in all required fields (Client, Class, Issue Date, Expiry Date).");
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="doc-modal-overlay">
      <div className="doc-modal-content" style={{ maxWidth: '600px' }}>
        <div className="doc-modal-header">
          <h2>{dsc ? "Edit DSC" : "New DSC"}</h2>
          <button className="doc-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="doc-modal-body">
          <div className="doc-form-group">
            <label>Client <span className="required-asterisk">*</span></label>
            <SearchableDropdown
              options={clientsData || []}
              value={formData.client}
              onChange={val => setFormData({ ...formData, client: val })}
              placeholder="Select..."
            />
          </div>
          <div className="doc-form-grid">
            <div className="doc-form-group">
              <label>Class <span className="required-asterisk">*</span></label>
              <select value={formData.class_type} onChange={e => setFormData({ ...formData, class_type: e.target.value })} className="doc-form-input">
                <option value="Class 1">Class 1</option>
                <option value="Class 2">Class 2</option>
                <option value="Class 3">Class 3</option>
              </select>
            </div>
            <div className="doc-form-group">
              <label>Password</label>
              <input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="doc-form-input" />
            </div>
          </div>
          <div className="doc-form-grid">
            <div className="doc-form-group">
              <label>Issue Date <span className="required-asterisk">*</span></label>
              <input type="date" value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} className="doc-form-input" />
            </div>
            <div className="doc-form-group">
              <label>Expiry Date <span className="required-asterisk">*</span></label>
              <input type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} className="doc-form-input" />
            </div>
          </div>
          <div className="doc-form-group">
            <label>Notes</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="doc-form-input" rows="3"></textarea>
          </div>
        </div>
        <div className="doc-modal-footer">
          <button className="doc-submit-btn" onClick={handleSave}>Save</button>
          <button className="doc-cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const DscManagement = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDsc, setEditingDsc] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingDsc, setViewingDsc] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dscToDelete, setDscToDelete] = useState(null);

  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    search: "",
    classType: "all"
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  const handleDebounceSearch = useCallback(
    debounce((value) => setDebouncedSearch(value), 500),
    []
  );

  const { data, isLoading } = useQuery({
    queryKey: ["dsc", { ...filters, search: debouncedSearch }, pagination.page],
    queryFn: async () => {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        class_type: filters.classType === 'all' ? undefined : filters.classType
      };
      const res = await listDsc(params);
      return res.data.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingDsc) {
        return updateDsc(editingDsc._id, formData);
      }
      return createDsc(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dsc"]);
      setIsModalOpen(false);
      setEditingDsc(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDsc(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["dsc"]);
      setIsDeleteModalOpen(false);
      setDscToDelete(null);
    }
  });

  const dscs = data?.items || (Array.isArray(data) ? data : []);
  const meta = data?.pagination || {};
  const total_pages = meta.total_pages || 0;
  const total = meta.total || (Array.isArray(data) ? data.length : 0);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
    if (key === 'search') {
      handleDebounceSearch(value);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <>
      <SideBar />
      <div className="clients">
        <div className="quotation-list-container">
          <div className="quotation-list-header">
            <div>
              <h1 className="quotation-list-title">DSC Management</h1>
              <p className="quotation-list-subtitle">Manage and track digital signature certificates</p>
            </div>
          </div>

          <DscFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onCreateNew={() => { setEditingDsc(null); setIsModalOpen(true); }}
          />

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>CLASS</th>
                  <th>ISSUE DATE</th>
                  <th>PASSWORD</th>
                  <th>EXPIRY DATE</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px", color: '#94a3b8' }}>Loading DSCs...</td></tr>
                ) : dscs.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px", color: '#94a3b8' }}>No DSCs found</td></tr>
                ) : (
                  dscs.map(dsc => (
                    <tr key={dsc._id} onClick={() => { setViewingDsc(dsc); setIsViewModalOpen(true); }} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: '600' }}>{dsc.client?.name}</td>
                      <td><span className={`doc-status-badge ${dsc.class_type?.replace(" ", "_") || ''}`}>{dsc.class_type}</span></td>
                      <td style={{ color: '#64748b' }}>{new Date(dsc.issue_date).toLocaleDateString()}</td>
                      <td style={{ color: '#475569', fontFamily: 'monospace' }}>{dsc.password || "-"}</td>
                      <td style={{ color: '#64748b' }}>{new Date(dsc.expiry_date).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); setViewingDsc(dsc); setIsViewModalOpen(true); }} title="View">
                            <Eye size={16} color="#64748b" />
                          </button>
                          <button className="action-icon-btn edit-btn-list" onClick={(e) => { e.stopPropagation(); setEditingDsc(dsc); setIsModalOpen(true); }} title="Edit">
                            <Pencil size={16} color="#7c3aed" />
                          </button>
                          <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); setDscToDelete(dsc); setIsDeleteModalOpen(true); }} title="Delete">
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && dscs.length > 0 && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, total)} of {total} entries
              </span>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  &lt;
                </button>
                {[...Array(total_pages || 0)].map((_, i) => (
                  <button
                    key={i}
                    className={`page-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={pagination.page === (total_pages || 1) || total_pages === 0}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <DscModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingDsc(null); }}
          dsc={editingDsc}
          onSave={(data) => saveMutation.mutate(data)}
        />
      )}

      {isViewModalOpen && (
        <DscViewModal
          isOpen={isViewModalOpen}
          onClose={() => { setIsViewModalOpen(false); setViewingDsc(null); }}
          dsc={viewingDsc}
        />
      )}

      {isDeleteModalOpen && (
        <Suspense fallback={null}>
          <DeleteModal
            title="Delete DSC"
            message="Are you sure you want to delete this DSC record?"
            onConfirm={() => deleteMutation.mutate(dscToDelete._id)}
            onCancel={() => { setIsDeleteModalOpen(false); setDscToDelete(null); }}
            submitting={deleteMutation.isLoading}
          />
        </Suspense>
      )}
    </>
  );
};

export default DscManagement;

