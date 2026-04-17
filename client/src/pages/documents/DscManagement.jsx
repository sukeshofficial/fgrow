import React, { useState, Suspense } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import SideBar from "../../components/SideBar";
import { listDsc, createDsc, updateDsc, deleteDsc } from "../../api/dsc.api";
import { listClientsByTenantId } from "../../api/client.api";
import { FaPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { FiUser, FiTag, FiCalendar, FiLock, FiCopy, FiCheck } from "react-icons/fi";
import SearchableDropdown from "../../components/ui/SearchableDropdown";

import "../../styles/Documents.css";

const DeleteModal = React.lazy(() => import("../../components/ui/DeleteModal"));

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
               <div className="doc-view-value"><FiUser className="doc-view-icon" /> {dsc.client?.name || "N/A"}</div>
            </div>
            <div className="doc-view-item">
               <span className="doc-view-label">Class</span>
               <div className="doc-view-value"><FiTag className="doc-view-icon" /> {dsc.class_type || "N/A"}</div>
            </div>
            <div className="doc-view-item">
               <span className="doc-view-label">Issue Date</span>
               <div className="doc-view-value"><FiCalendar className="doc-view-icon" /> {dsc.issue_date ? new Date(dsc.issue_date).toLocaleDateString() : "N/A"}</div>
            </div>
            <div className="doc-view-item">
               <span className="doc-view-label">Expiry Date</span>
               <div className="doc-view-value"><FiCalendar className="doc-view-icon" /> {dsc.expiry_date ? new Date(dsc.expiry_date).toLocaleDateString() : "N/A"}</div>
            </div>
            <div className="doc-view-item">
               <span className="doc-view-label">Password</span>
               <div className="doc-view-value" style={{ fontFamily: "monospace", letterSpacing: "1px" }}>
                 <FiLock className="doc-view-icon" /> 
                 <span>{dsc.password || "N/A"}</span>
                 {dsc.password && (
                   <button 
                     onClick={handleCopy} 
                     style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', padding: '4px', marginLeft: 'auto', borderRadius: '4px' }}
                     title="Copy Password"
                   >
                     {copied ? <FiCheck style={{ color: '#10b981', fontSize: '16px' }} /> : <FiCopy style={{ color: '#94a3b8', fontSize: '16px' }} />}
                   </button>
                 )}
               </div>
            </div>
          </div>
          <div className="doc-view-item no-border">
             <span className="doc-view-label">Notes</span>
             <div className="doc-view-value notes-box">{dsc.notes || "None"}</div>
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

  const { data, isLoading } = useQuery({
    queryKey: ["dsc"],
    queryFn: async () => {
      const res = await listDsc({ limit: 100 });
      return res.data.data.items || res.data.data || [];
    }
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
    },
    onError: (err) => {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to save DSC");
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

  const dscs = data || [];

  return (
    <>
      <SideBar />
      <div className="documents-page">
        <div className="documents-container">
          <div className="documents-header">
            <h1 className="documents-title">DSC Management</h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="doc-cancel-btn" style={{ borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '8px' }}>Import</button>
              <button className="doc-cancel-btn" style={{ borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '8px' }}>Export</button>
              <button className="doc-create-btn" onClick={() => { setEditingDsc(null); setIsModalOpen(true); }}>
                <FaPlus /> New
              </button>
            </div>
          </div>
          
          <div className="doc-table-container">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>CLASS</th>
                  <th>ISSUE DATE</th>
                  <th>PASSWORD</th>
                  <th>EXPIRY DATE</th>
                  <th>NOTES</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>Loading...</td></tr> : 
                 dscs.length === 0 ? <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>No DSCs found</td></tr> :
                 dscs.map(dsc => (
                  <tr key={dsc._id} onClick={() => { setViewingDsc(dsc); setIsViewModalOpen(true); }} style={{ cursor: "pointer" }}>
                    <td>{dsc.client?.name}</td>
                    <td>{dsc.class_type}</td>
                    <td>{new Date(dsc.issue_date).toLocaleDateString()}</td>
                    <td>{dsc.password || "-"}</td>
                    <td>{new Date(dsc.expiry_date).toLocaleDateString()}</td>
                    <td>{dsc.notes}</td>
                    <td>
                      <div className="doc-action-buttons" style={{ display: 'flex', gap: '10px' }}>
                         <button className="doc-action-btn" onClick={(e) => { e.stopPropagation(); setViewingDsc(dsc); setIsViewModalOpen(true); }} title="View Details"><FaEye /></button>
                         <button className="doc-action-btn" onClick={(e) => { e.stopPropagation(); setEditingDsc(dsc); setIsModalOpen(true); }} title="Edit"><FaEdit /></button>
                         <button className="doc-action-btn delete" onClick={(e) => { e.stopPropagation(); setDscToDelete(dsc); setIsDeleteModalOpen(true); }} style={{ color: "red" }} title="Delete"><FaTrash /></button>
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
