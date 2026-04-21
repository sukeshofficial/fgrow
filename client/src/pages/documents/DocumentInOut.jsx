import React, { useState, Suspense, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import SideBar from "../../components/SideBar";
import { listDocuments, createDocument, updateDocument, deleteDocument, returnDocument } from "../../api/document.api";
import { listClientsByTenantId } from "../../api/client.api";
import { listDocumentTypes, createDocumentType, deleteDocumentType } from "../../api/documentType.api";
import { Eye, Pencil, Trash2, RotateCcw } from "lucide-react";
import GlobalModal from "../../components/ui/GlobalModal";
import SearchableDropdown from "../../components/ui/SearchableDropdown";
import DocumentFilterBar from "./components/DocumentFilterBar";

// Use shared styles from quotations
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

const DocumentViewModal = ({ isOpen, onClose, document }) => {
  if (!isOpen || !document) return null;
  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div className="doc-modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="doc-modal-header">
          <h2>Document Details</h2>
          <button className="doc-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="doc-modal-body">
          <div className="doc-view-grid">
            <div className="doc-view-item">
              <span className="doc-view-label">Date</span>
              <div className="doc-view-value">{document.date ? new Date(document.date).toLocaleDateString() : "N/A"}</div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Category</span>
              <div className="doc-view-value">
                <span className={`doc-status-badge ${document.category || ''}`} style={{ textTransform: "capitalize" }}>{document.category || "N/A"}</span>
              </div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Document Type</span>
              <div className="doc-view-value">{document.document_type?.name || "N/A"}</div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Client</span>
              <div className="doc-view-value">{document.client?.name || "N/A"}</div>
            </div>
            <div className="doc-view-item full-width">
              <span className="doc-view-label">Location</span>
              <div className="doc-view-value">{document.location || "N/A"}</div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Returnable</span>
              <div className="doc-view-value">
                {document.is_returnable ? "Yes" : "No"}
              </div>
            </div>
            <div className="doc-view-item">
              <span className="doc-view-label">Returned</span>
              <div className="doc-view-value">
                {document.returned ? `Yes (On ${document.returned_on ? new Date(document.returned_on).toLocaleDateString() : 'N/A'})` : "No"}
              </div>
            </div>
          </div>
          <div className="doc-view-item no-border" style={{ marginTop: '16px' }}>
            <span className="doc-view-label">Notes</span>
            <div className="doc-view-value" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--primary-accent)' }}>{document.notes || "None"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentInOutModal = ({ isOpen, onClose, document, onSave }) => {
  const [formData, setFormData] = useState({
    date: document?.date ? document.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
    category: document?.category || "given",
    document_type: document?.document_type?._id || "",
    client: document?.client?._id || "",
    location: document?.location || "",
    is_returnable: document?.is_returnable || false,
    notes: document?.notes || ""
  });

  const { data: clientsData } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await listClientsByTenantId({ limit: 1000 });
      return res.data.data.items || res.data.data || [];
    }
  });

  const { data: documentTypesData, refetch: refetchDocumentTypes } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: async () => {
      const res = await listDocumentTypes({ limit: 1000 });
      return res.data.data.items || res.data.data || [];
    }
  });

  const handleCreateDocumentType = async (name) => {
    try {
      const res = await createDocumentType({ name });
      await refetchDocumentTypes();
      setFormData({ ...formData, document_type: res.data.data._id });
    } catch (err) {
      console.error("Failed to create document type", err);
    }
  };

  const handleDeleteDocumentType = async (id) => {
    if (window.confirm("Are you sure you want to delete this document type?")) {
      try {
        await deleteDocumentType(id);
        await refetchDocumentTypes();
        if (formData.document_type === id) {
          setFormData({ ...formData, document_type: "" });
        }
      } catch (err) {
        alert(err?.response?.data?.message || err.message || "Failed to delete document type");
      }
    }
  };

  const handleSave = () => {
    if (!formData.date || !formData.category || !formData.document_type || !formData.client) {
      alert("Please fill in all required fields.");
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="doc-modal-overlay">
      <div className="doc-modal-content" style={{ maxWidth: '600px' }}>
        <div className="doc-modal-header">
          <h2>{document ? "Edit Document" : "New Document"}</h2>
          <button className="doc-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="doc-modal-body">
          <div className="doc-form-grid">
            <div className="doc-form-group">
              <label>Date <span className="required-asterisk">*</span></label>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="doc-form-input" />
            </div>
            <div className="doc-form-group">
              <label>Category <span className="required-asterisk">*</span></label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="doc-form-input">
                <option value="given">Given</option>
                <option value="received">Received</option>
              </select>
            </div>
          </div>
          <div className="doc-form-grid">
            <div className="doc-form-group">
              <label>Document Type <span className="required-asterisk">*</span></label>
              <SearchableDropdown
                options={documentTypesData || []}
                value={formData.document_type}
                onChange={val => setFormData({ ...formData, document_type: val })}
                placeholder="Select..."
                onAddNew={handleCreateDocumentType}
                onDeleteOption={handleDeleteDocumentType}
                addNewLabel="Create new type"
              />
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
          </div>
          <div className="doc-form-group">
            <label>Doc. Location</label>
            <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="doc-form-input" />
          </div>
          <div className="document-toggle-container">
            <label className="switch">
              <input type="checkbox" checked={formData.is_returnable} onChange={e => setFormData({ ...formData, is_returnable: e.target.checked })} />
              <span className="slider round"></span>
            </label>
            <span>Is document returnable?</span>
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

const DocumentInOut = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    search: "",
    category: "all"
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  const handleDebounceSearch = useCallback(
    debounce((value) => setDebouncedSearch(value), 500),
    []
  );

  const { data, isLoading } = useQuery({
    queryKey: ["documents", { ...filters, search: debouncedSearch }, pagination.page],
    queryFn: async () => {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        category: filters.category === 'all' ? undefined : filters.category
      };
      const res = await listDocuments(params);
      return res.data.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingDoc) {
        return updateDocument(editingDoc._id, formData);
      }
      return createDocument(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["documents"]);
      setIsModalOpen(false);
      setEditingDoc(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["documents"]);
      setIsDeleteModalOpen(false);
      setDocToDelete(null);
    }
  });

  const returnMutation = useMutation({
    mutationFn: (id) => returnDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["documents"]);
    }
  });

  const documents = data?.items || (Array.isArray(data) ? data : []);
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
              <h1 className="quotation-list-title">Documents In-Out</h1>
              <p className="quotation-list-subtitle">Manage and track your physical documents register</p>
            </div>
          </div>

          <DocumentFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onCreateNew={() => { setEditingDoc(null); setIsModalOpen(true); }}
          />

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>DOC. TYPE</th>
                  <th>CATEGORY</th>
                  <th>CLIENT</th>
                  <th>LOCATION</th>
                  <th>RETURNABLE</th>
                  <th>RETURNED</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "40px", color: '#94a3b8' }}>Loading documents...</td></tr>
                ) : documents.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "40px", color: '#94a3b8' }}>No documents found</td></tr>
                ) : (
                  documents.map(doc => (
                    <tr key={doc._id} onClick={() => { setViewingDoc(doc); setIsViewModalOpen(true); }} style={{ cursor: 'pointer' }}>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>{new Date(doc.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '600' }}>{doc.document_type?.name}</td>
                      <td><span className={`doc-status-badge ${doc.category || ''}`} style={{ textTransform: "capitalize" }}>{doc.category}</span></td>
                      <td style={{ color: '#475569' }}>{doc.client?.name}</td>
                      <td style={{ color: '#64748b' }}>{doc.location}</td>
                      <td style={{ color: '#64748b' }}>{doc.is_returnable ? "Yes" : "No"}</td>
                      <td style={{ color: '#64748b' }}>{doc.returned ? "Yes" : "No"}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); setViewingDoc(doc); setIsViewModalOpen(true); }} title="View">
                            <Eye size={16} color="#64748b" />
                          </button>
                          <button className="action-icon-btn edit-btn-list" onClick={(e) => { e.stopPropagation(); setEditingDoc(doc); setIsModalOpen(true); }} title="Edit">
                            <Pencil size={16} color="#7c3aed" />
                          </button>
                          {doc.is_returnable && !doc.returned && (
                            <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); returnMutation.mutate(doc._id); }} title="Return">
                              <RotateCcw size={16} color="#3b82f6" />
                            </button>
                          )}
                          <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); setDocToDelete(doc); setIsDeleteModalOpen(true); }} title="Delete">
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
          {!isLoading && documents.length > 0 && (
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
        <DocumentInOutModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingDoc(null); }}
          document={editingDoc}
          onSave={(data) => saveMutation.mutate(data)}
        />
      )}

      {isViewModalOpen && (
        <DocumentViewModal
          isOpen={isViewModalOpen}
          onClose={() => { setIsViewModalOpen(false); setViewingDoc(null); }}
          document={viewingDoc}
        />
      )}

      {isDeleteModalOpen && (
        <Suspense fallback={null}>
          <DeleteModal
            title="Delete Document"
            message="Are you sure you want to delete this document?"
            onConfirm={() => deleteMutation.mutate(docToDelete._id)}
            onCancel={() => { setIsDeleteModalOpen(false); setDocToDelete(null); }}
            submitting={deleteMutation.isLoading}
          />
        </Suspense>
      )}
    </>
  );
};

export default DocumentInOut;

