import React, { useState, useEffect, useRef } from "react";
import FormField from "../../../components/ui/FormField";
import SearchableDropdown from "../../../components/ui/SearchableDropdown";
import { 
  listClientGroups, 
  listTags, 
  createClientGroup, 
  createTag,
  uploadClientPhoto 
} from "../../../api/client.api";

const ClientDetailsForm = ({ data, onNext, onPrev, isEdit, isTransitioning }) => {
  const [form, setForm] = useState(data);
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchGroups();
    fetchTags();
  }, []);

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  const fetchGroups = async () => {
    try {
      const resp = await listClientGroups();
      setGroups(resp.data.data);
    } catch (e) {
      console.error("Failed to fetch groups", e);
    }
  };

  const fetchTags = async () => {
    try {
      const resp = await listTags();
      setTags(resp.data.data);
    } catch (e) {
      console.error("Failed to fetch tags", e);
    }
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Only JPG, PNG and WebP files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const resp = await uploadClientPhoto(file);
      const { public_id, secure_url } = resp.data.data;
      handleChange("photo", { public_id, secure_url });
    } catch (err) {
      console.error("Upload failed", err);
      const msg = err.response?.data?.error || err.response?.data?.message || "Failed to upload photo";
      alert(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "Name is required";
    if (!form.group) newErrors.group = "Group is required";
    if (!form.tags || form.tags.length === 0) newErrors.tags = "At least one tag is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext(form);
    }
  };

  const handleAddGroup = async () => {
    const name = prompt("Enter new Group name:");
    if (!name) return;
    try {
      const resp = await createClientGroup({ name });
      const newGroup = resp.data.data;
      setGroups(prev => [...prev, newGroup]);
      handleChange("group", newGroup._id);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to create group");
    }
  };

  const handleAddTag = async () => {
    const name = prompt("Enter new Tag name:");
    if (!name) return;
    try {
      const resp = await createTag({ name });
      const newTag = resp.data.data;
      setTags(prev => [...prev, newTag]);
      const currentTags = Array.isArray(form.tags) ? form.tags : [];
      handleChange("tags", [...currentTags, newTag._id]);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to create tag");
    }
  };

  return (
    <div className={`step-container ${isTransitioning ? "slide-down-active" : ""}`}>
      <h2 className="form-title">Client Details</h2>
      
      <div className="form-layout">
        <div className="form-fields-column">
          <div className="form-grid">
            <FormField label="Name" required error={errors.name}>
              <input 
                type="text" 
                className="form-input" 
                value={form.name} 
                onChange={(e) => handleChange("name", e.target.value)} 
                placeholder="Enter client name"
              />
            </FormField>
            
            <FormField label="File No">
              <input 
                type="text" 
                className="form-input" 
                value={form.file_no} 
                onChange={(e) => handleChange("file_no", e.target.value)} 
                placeholder="Enter file number"
              />
            </FormField>
            
            <FormField label="GSTIN">
              <input 
                type="text" 
                className="form-input" 
                value={form.gstin} 
                onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())} 
                placeholder="Enter GSTIN"
              />
            </FormField>
            
            <FormField label="PAN">
              <input 
                type="text" 
                className="form-input" 
                value={form.pan} 
                onChange={(e) => handleChange("pan", e.target.value.toUpperCase())} 
                placeholder="Enter PAN"
              />
            </FormField>

            <FormField label="Select Group" required error={errors.group}>
              <SearchableDropdown 
                options={groups} 
                value={form.group} 
                onChange={(val) => handleChange("group", val)} 
                placeholder="Search group"
                onAddNew={handleAddGroup}
                addNewLabel="Add Group"
              />
            </FormField>

            <FormField label="Select Tags" required error={errors.tags}>
              <SearchableDropdown 
                isMulti 
                options={tags} 
                value={form.tags} 
                onChange={(val) => handleChange("tags", val)} 
                placeholder="Search tags"
                onAddNew={handleAddTag}
                addNewLabel="Add Tag"
              />
            </FormField>
          </div>
        </div>

        <div className="logo-column">
          <label className="form-label">Client Photo / Logo</label>
          <div 
            className={`logo-upload-container ${isUploading ? "uploading" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {form.photo?.secure_url ? (
              <img 
                src={form.photo.secure_url} 
                alt="Client" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} 
              />
            ) : (
              <>
                <div className="upload-icon">{isUploading ? "..." : "+"}</div>
                <div className="logo-placeholder">
                  {isUploading ? "Uploading..." : "Upload photo or drag and drop"}
                </div>
                {!isUploading && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                    PNG, JPG up to 5MB
                  </div>
                )}
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
              accept="image/*"
            />
          </div>
          {form.photo?.secure_url && (
            <button 
              type="button" 
              className="link-btn" 
              style={{ marginTop: '8px', fontSize: '12px' }}
              onClick={(e) => {
                e.stopPropagation();
                handleChange("photo", null);
              }}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <div className="wizard-footer">
        <button type="button" className="back-btn" onClick={onPrev}>
          Back
        </button>
        <button className="next-button" style={{ position: 'static' }} onClick={handleNext}>
          Next Step
        </button>
      </div>
    </div>
  );
};

export default ClientDetailsForm;
