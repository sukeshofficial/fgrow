import React, { useState, Suspense } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import SideBar from "../../components/SideBar";
import { listDocuments, createDocument, updateDocument, deleteDocument, returnDocument } from "../../api/document.api";
import { listClientsByTenantId } from "../../api/client.api";
import { listDocumentTypes, createDocumentType, deleteDocumentType } from "../../api/documentType.api";
import { FaPlus } from "react-icons/fa";
import { FiEdit, FiTrash, FiEye, FiCalendar, FiFileText, FiUser, FiMapPin, FiCornerUpLeft, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { IoIosReturnLeft } from "react-icons/io";
import GlobalModal from "../../components/ui/GlobalModal";
import SearchableDropdown from "../../components/ui/SearchableDropdown";

import "../../styles/Documents.css";

const DeleteModal = React.lazy(() => import("../../components/ui/DeleteModal"));

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
               <div className="doc-view-value"><FiCalendar className="doc-view-icon" /> {document.date ? new Date(document.date).toLocaleDateString() : "N/A"}</div>
            </div>
            <div className="doc-view-item">
               <span className="doc-view-label">Category</span>
               <div className="doc-view-value">
                 <span className={`doc-status-badge ${document.category || ''}`} style={{ textTransform: "capitalize" }}>{document.category || "N/A"}</span>
               </div>
            </div>
            <div className="doc-view-item">
               <span className="doc-view-label">Document Type</span>
               <div className="doc-view-value"><FiFileText className="doc-view-icon" /> {document.document_type?.name || "N/A"}</div>
            </div>
            <div className="doc-view-item">
               <span className="doc-view-label">Client</span>
               <div className="doc-view-value"><FiUser className="doc-view-icon" /> {document.client?.name || "N/A"}</div>
            </div>
            <div className="doc-view-item full-width">
               <span className="doc-view-label">Location</span>
               <div className="doc-view-value"><FiMapPin className="doc-view-icon" /> {document.location || "N/A"}</div>
            </div>
            <div className="doc-view-item">
               <span className="doc-view-label">Returnable</span>
               <div className="doc-view-value">
                 {document.is_returnable ? <FiCornerUpLeft className="doc-view-icon" style={{color: '#3b82f6'}}/> : <FiXCircle className="doc-view-icon" />} 
                 {document.is_returnable ? "Yes" : "No"}
               </div>
            </div>
            <div className="doc-view-item">
               <span className="doc-view-label">Returned</span>
               <div className="doc-view-value">
                 {document.returned ? <FiCheckCircle className="doc-view-icon" style={{color: '#10b981'}}/> : <FiXCircle className="doc-view-icon" />}
                 {document.returned ? `Yes (On ${document.returned_on ? new Date(document.returned_on).toLocaleDateString() : 'N/A'})` : "No"}
               </div>
            </div>
          </div>
          <div className="doc-view-item no-border">
             <span className="doc-view-label">Notes</span>
             <div className="doc-view-value notes-box">{document.notes || "None"}</div>
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
    } catch(err) {
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

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await listDocuments({ limit: 100 });
      return res.data.data.items || res.data.data || [];
    }
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
    },
    onError: (err) => {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to save Document In/Out");
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
    },
    onError: (err) => {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to return Document");
    }
  });

  const documents = data || [];

  return (
    <>
      <SideBar />
      <div className="documents-page">
        <div className="documents-container">
          <div className="documents-header">
            <h1 className="documents-title">Documents In-Out Register</h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="doc-cancel-btn" style={{ borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => returnMutation.mutate('export')}>
                Export
              </button>
              <button className="doc-create-btn" onClick={() => { setEditingDoc(null); setIsModalOpen(true); }}>
                <FaPlus /> New
              </button>
            </div>
          </div>
          
          <div className="doc-table-container">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>DOC. TYPE</th>
                  <th>CATEGORY</th>
                  <th>CLIENT</th>
                  <th>LOCATION</th>
                  <th>RETURNABLE</th>
                  <th>RETURNED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>Loading...</td></tr> : 
                 documents.length === 0 ? <tr><td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>No documents found</td></tr> :
                 documents.map(doc => (
                  <tr key={doc._id} onClick={() => { setViewingDoc(doc); setIsViewModalOpen(true); }} style={{ cursor: "pointer" }}>
                    <td>{new Date(doc.date).toLocaleDateString()}</td>
                    <td>{doc.document_type?.name}</td>
                    <td><span className={`doc-status-badge ${doc.category || ''}`} style={{ textTransform: "capitalize" }}>{doc.category}</span></td>
                    <td>{doc.client?.name}</td>
                    <td>{doc.location}</td>
                    <td>{doc.is_returnable ? "Yes" : "No"}</td>
                    <td>{doc.returned ? "Yes" : "No"}</td>
                    <td>
                      <div className="doc-action-buttons" style={{ display: 'flex', gap: '10px' }}>
                         <button className="doc-action-btn" onClick={(e) => { e.stopPropagation(); setViewingDoc(doc); setIsViewModalOpen(true); }} title="View Details"><FiEye /></button>
                         <button className="doc-action-btn" onClick={(e) => { e.stopPropagation(); setEditingDoc(doc); setIsModalOpen(true); }} title="Edit"><FiEdit /></button>
                         {doc.is_returnable && !doc.returned && (
                           <button className="doc-action-btn " onClick={(e) => { e.stopPropagation(); returnMutation.mutate(doc._id); }} title="Return Document"><IoIosReturnLeft /></button>
                         )}
                         <button className="doc-action-btn delete" onClick={(e) => { e.stopPropagation(); setDocToDelete(doc); setIsDeleteModalOpen(true); }} style={{ color: "red" }} title="Delete"><FiTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
