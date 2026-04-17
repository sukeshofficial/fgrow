import React, { useState, Suspense } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import SideBar from "../../components/SideBar";
import { 
  listCollectionRequests, 
  createCollectionRequest, 
  updateCollectionRequest, 
  deleteCollectionRequest 
} from "../../api/documentCollection.api";
import { listClientsByTenantId } from "../../api/client.api";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import SearchableDropdown from "../../components/ui/SearchableDropdown";

import "../../styles/Documents.css";

const DeleteModal = React.lazy(() => import("../../components/ui/DeleteModal"));

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reqToDelete, setReqToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["collection-requests"],
    queryFn: async () => {
      const res = await listCollectionRequests({ limit: 100 });
      return res.data.data.items || res.data.data || [];
    }
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
    },
    onError: (err) => {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to save Collection Request");
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

  const requests = data || [];

  return (
    <>
      <SideBar />
      <div className="documents-page">
        <div className="documents-container">
          <div className="documents-header">
            <h1 className="documents-title">Document Collection Requests</h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="doc-cancel-btn" style={{ borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '8px' }}>Export</button>
              <button className="doc-create-btn" onClick={() => { setEditingReq(null); setIsModalOpen(true); }}>
                <FaPlus /> New
              </button>
            </div>
          </div>
          
          <div className="doc-table-container">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>CLIENT</th>
                  <th>TASK</th>
                  <th>DOCUMENTS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>Loading...</td></tr> : 
                 requests.length === 0 ? <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No Collection Requests found</td></tr> :
                 requests.map(req => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>{req.client?.name}</td>
                    <td>{req.task}</td>
                    <td>{req.documents_count || 0}</td>
                    <td><span className={`doc-status-badge ${req.status}`}>{req.status.replace("_", " ")}</span></td>
                    <td>
                      <div className="doc-action-buttons" style={{ display: 'flex', gap: '10px' }}>
                         <button className="doc-action-btn" onClick={() => { setEditingReq(req); setIsModalOpen(true); }} title="Edit"><FaEdit /></button>
                         <button className="doc-action-btn delete" onClick={() => { setReqToDelete(req); setIsDeleteModalOpen(true); }} style={{ color: "red" }} title="Delete"><FaTrash /></button>
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
        <CollectionRequestModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingReq(null); }}
          request={editingReq}
          onSave={(data) => saveMutation.mutate(data)}
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
