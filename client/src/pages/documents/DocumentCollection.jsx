import React, { useState, Suspense, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import SideBar from "../../components/SideBar";
import {
  listCollectionRequests,
  createCollectionRequest,
  updateCollectionRequest,
  deleteCollectionRequest
} from "../../api/documentCollection.api";
import { listClientsByTenantId } from "../../api/client.api";
import { Pencil, Trash2, Eye } from "lucide-react";
import SearchableDropdown from "../../components/ui/SearchableDropdown";
import CollectionFilterBar from "./components/CollectionFilterBar";

import "../../styles/Documents.css";
import "../quotations/quotations.css";

const DeleteModal = React.lazy(() => import("../../components/ui/DeleteModal"));

const CollectionViewModal = ({ isOpen, onClose, request }) => {
  if (!isOpen || !request) return null;
  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div className="doc-modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="doc-modal-header">
          <h2>Collection Request Details</h2>
          <button className="doc-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="doc-modal-body">
          <div className="doc-view-grid">
            <div className="doc-view-item">
              <span className="doc-view-label">Date</span>
              <div className="doc-view-value">{new Date(request.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Status</span>
              <div className="doc-view-value">
                <span className={`doc-status-badge ${request.status}`}>{request.status.replace("_", " ")}</span>
              </div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Client</span>
              <div className="doc-view-value">{request.client?.name || "N/A"}</div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">No. of Documents</span>
              <div className="doc-view-value">{request.documents_count || 0}</div>
            </div>
            <div className="doc-view-item full-width">
              <span className="doc-view-label">Task</span>
              <div className="doc-view-value">{request.task}</div>
            </div>
          </div>
          <div className="doc-view-item no-border" style={{ marginTop: '16px' }}>
            <span className="doc-view-label">Message</span>
            <div className="doc-view-value" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--primary-accent)' }}>
              {request.message || "No description provided"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CollectionRequestModal = ({ isOpen, onClose, request, onSave }) => {
  const [formData, setFormData] = useState({
    client: request?.client?._id || "",
    status: request?.status || "open",
    task: request?.task || "",
    message: request?.message || "",
    documents_count: request?.documents_count || 0,
  });

  const { data: clientsData } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await listClientsByTenantId({ limit: 1000 });
      return res.data.data.items || res.data.data || [];
    }
  });
  const handleSave = () => {
    if (!formData.client || !formData.task || !formData.message) {
      alert("Please fill in all required fields (Client, Task, Message).");
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="doc-modal-overlay">
      <div className="doc-modal-content" style={{ maxWidth: '600px' }}>
        <div className="doc-modal-header">
          <h2>{request ? "Edit Doc. Collection Request" : "New Doc. Collection Request"}</h2>
          <button className="doc-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="doc-modal-body">
          <div className="doc-form-group">
            <label>Status <span className="required-asterisk">*</span></label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="doc-form-input">
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="doc-form-group">
            <label>Client <span className="required-asterisk">*</span></label>
            <SearchableDropdown
              options={clientsData || []}
              value={formData.client}
              onChange={val => setFormData({ ...formData, client: val })}
              placeholder="Select..."
            />
          </div>
          <div className="doc-form-group">
            <label>Task <span className="required-asterisk">*</span></label>
            <input type="text" value={formData.task} onChange={e => setFormData({ ...formData, task: e.target.value })} className="doc-form-input" placeholder="Select..." />
          </div>
          <div className="doc-form-group">
            <label>Message <span className="required-asterisk">*</span></label>
            <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="doc-form-input" rows="4"></textarea>
          </div>
          <div className="doc-form-group">
            <label>No. of Documents <span className="required-asterisk">*</span></label>
            <input type="number" min="0" value={formData.documents_count} onChange={e => setFormData({ ...formData, documents_count: Number(e.target.value) })} className="doc-form-input" placeholder="Number of Documents..." />
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

const DocumentCollection = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingReq, setViewingReq] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reqToDelete, setReqToDelete] = useState(null);

  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    search: "",
    status: "all"
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleDebounceSearch = useCallback(
    debounce((value) => setDebouncedSearch(value), 500),
    []
  );

  const { data, isLoading } = useQuery({
    queryKey: ["collection-requests", { ...filters, search: debouncedSearch }, pagination.page],
    queryFn: async () => {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: filters.status === 'all' ? undefined : filters.status
      };
      const res = await listCollectionRequests(params);
      return res.data.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingReq) {
        return updateCollectionRequest(editingReq._id, formData);
      }
      return createCollectionRequest(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["collection-requests"]);
      setIsModalOpen(false);
      setEditingReq(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCollectionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["collection-requests"]);
      setIsDeleteModalOpen(false);
      setReqToDelete(null);
    }
  });

  const requests = data?.items || (Array.isArray(data) ? data : []);
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
              <h1 className="quotation-list-title">Document Collection</h1>
              <p className="quotation-list-subtitle">Manage and track your document collection requests</p>
            </div>
          </div>

          <CollectionFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onCreateNew={() => { setEditingReq(null); setIsModalOpen(true); }}
          />

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>CLIENT</th>
                  <th>TASK</th>
                  <th>DOCUMENTS</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px", color: '#94a3b8' }}>Loading requests...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px", color: '#94a3b8' }}>No requests found</td></tr>
                ) : (
                  requests.map(req => (
                    <tr key={req._id} onClick={() => { setViewingReq(req); setIsViewModalOpen(true); }} style={{ cursor: 'pointer' }}>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '600' }}>{req.client?.name}</td>
                      <td style={{ color: '#475569' }}>{req.task}</td>
                      <td style={{ color: '#64748b' }}>{req.documents_count || 0}</td>
                      <td><span className={`doc-status-badge ${req.status}`}>{req.status.replace("_", " ")}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); setViewingReq(req); setIsViewModalOpen(true); }} title="View">
                            <Eye size={16} color="#64748b" />
                          </button>
                          <button className="action-icon-btn edit-btn-list" onClick={(e) => { e.stopPropagation(); setEditingReq(req); setIsModalOpen(true); }} title="Edit">
                            <Pencil size={16} color="#7c3aed" />
                          </button>
                          <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); setReqToDelete(req); setIsDeleteModalOpen(true); }} title="Delete">
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
          {!isLoading && requests.length > 0 && (
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
        <CollectionRequestModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingReq(null); }}
          request={editingReq}
          onSave={(data) => saveMutation.mutate(data)}
        />
      )}

      {isViewModalOpen && (
        <CollectionViewModal
          isOpen={isViewModalOpen}
          onClose={() => { setIsViewModalOpen(false); setViewingReq(null); }}
          request={viewingReq}
        />
      )}

      {isDeleteModalOpen && (
        <Suspense fallback={null}>
          <DeleteModal
            title="Delete Request"
            message="Are you sure you want to delete this Collection Request?"
            onConfirm={() => deleteMutation.mutate(reqToDelete._id)}
            onCancel={() => { setIsDeleteModalOpen(false); setReqToDelete(null); }}
            submitting={deleteMutation.isLoading}
          />
        </Suspense>
      )}
    </>
  );
};

export default DocumentCollection;

