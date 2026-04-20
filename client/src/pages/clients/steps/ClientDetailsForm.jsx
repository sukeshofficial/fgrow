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
import { useModal } from "../../../context/ModalContext";

const ClientDetailsForm = ({ data, onNext, onPrev, isEdit, isTransitioning }) => {
  const { showAlert } = useModal();
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Inline input modal state (replaces browser prompt)
  const [inputModal, setInputModal] = useState({ open: false, type: "", value: "", loading: false, error: "" });

  useEffect(() => {
    fetchGroups();
    fetchTags();
  }, []);

  const [form, setForm] = useState({
    name: "",
    file_no: "",
    gstin: "",
    pan: "",
    type: "Individual",
    customType: "",
    group: "",
    tags: [],
    photo: null,
    ...data
  });

  useEffect(() => {
    if (data) {
      setForm(prev => ({ ...prev, ...data }));
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

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      await showAlert("Invalid File", "Only JPG, PNG and WebP files are allowed.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      await showAlert("File Too Large", "File size should be less than 5MB.", "warning");
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
      await showAlert("Upload Error", msg, "error");
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

  // Open modal for group or tag
  const handleAddGroup = () => {
    setInputModal({ open: true, type: "group", value: "", loading: false, error: "" });
  };

  const handleAddTag = () => {
    setInputModal({ open: true, type: "tag", value: "", loading: false, error: "" });
  };

  // Confirm modal submission
  const handleInputModalConfirm = async () => {
    const name = inputModal.value.trim();
    if (!name) {
      setInputModal(prev => ({ ...prev, error: "Name cannot be empty." }));
      return;
    }
    setInputModal(prev => ({ ...prev, loading: true, error: "" }));
    try {
      if (inputModal.type === "group") {
        const resp = await createClientGroup({ name });
        const newGroup = resp.data.data;
        setGroups(prev => [...prev, newGroup]);
        handleChange("group", newGroup._id);
      } else if (inputModal.type === "tag") {
        const resp = await createTag({ name });
        const newTag = resp.data.data;
        setTags(prev => [...prev, newTag]);
        const currentTags = Array.isArray(form.tags) ? form.tags : [];
        handleChange("tags", [...currentTags, newTag._id]);
      } else if (inputModal.type === "client_type") {
        // For custom client type, set type to "Other" and customType to name
        setForm(prev => ({
          ...prev,
          type: "Other",
          customType: name
        }));
      }
      setInputModal({ open: false, type: "", value: "", loading: false, error: "" });
    } catch (e) {
      setInputModal(prev => ({
        ...prev,
        loading: false,
        error: e.response?.data?.message || `Failed to create ${inputModal.type}`
      }));
    }
  };

  const handleInputModalClose = () => {
    setInputModal({ open: false, type: "", value: "", loading: false, error: "" });
  };

  const modalLabel = inputModal.type === "group" ? "Group" : inputModal.type === "tag" ? "Tag" : "Client Type";

  const clientTypes = [
    { _id: "Individual", name: "Individual" },
    { _id: "Sole Proprietorship", name: "Sole Proprietorship" },
    { _id: "Partnership", name: "Partnership" },
    { _id: "LLP", name: "LLP" },
    { _id: "HUF", name: "HUF" },
    { _id: "Private Limited", name: "Private Limited" },
    { _id: "Limited Company", name: "Limited Company" },
    { _id: "One-Person Company", name: "One-Person Company" },
    { _id: "NGO", name: "NGO" },
    { _id: "Trust", name: "Trust" },
    { _id: "Government Entity", name: "Government Entity" },
    { _id: "Other", name: "Other" }
  ];

  // If currently "Other" with a customType, add it to the list temporarily for selection display
  if (form.type === "Other" && form.customType && !clientTypes.find(t => t.name === form.customType)) {
    clientTypes.push({ _id: form.customType, name: form.customType });
  }

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

            <FormField label="Client Type" required>
              <SearchableDropdown
                options={clientTypes}
                value={form.type === "Other" ? form.customType : form.type}
                onChange={(val) => {
                  const isStandard = clientTypes.find(t => t._id === val && t._id !== "Other");
                  if (isStandard && val !== form.customType) {
                    setForm(prev => ({ ...prev, type: val, customType: "" }));
                  } else if (val === "Other") {
                    setInputModal({ open: true, type: "client_type", value: "", loading: false, error: "" });
                  } else {
                    // It's the custom type
                    setForm(prev => ({ ...prev, type: "Other", customType: val }));
                  }
                }}
                placeholder="Select client type"
                onAddNew={(search) => setInputModal({ open: true, type: "client_type", value: search, loading: false, error: "" })}
                addNewLabel="Add New Type"
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

      {/* Inline Input Modal — replaces browser prompt() */}
      {inputModal.open && (
        <div style={overlayStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ margin: "0 0 16px", fontSize: "17px", fontWeight: 700, color: "#1f2937" }}>
              Add New {modalLabel}
            </h3>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {modalLabel} Name *
            </label>
            <input
              type="text"
              autoFocus
              value={inputModal.value}
              onChange={(e) => setInputModal(prev => ({ ...prev, value: e.target.value, error: "" }))}
              onKeyDown={(e) => { if (e.key === "Enter") handleInputModalConfirm(); if (e.key === "Escape") handleInputModalClose(); }}
              placeholder={`e.g. ${inputModal.type === "group" ? "Corporate Clients" : inputModal.type === "tag" ? "VIP" : "Private Trust"}`}
              style={inputStyle}
            />
            {inputModal.error && (
              <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", marginBottom: 0 }}>{inputModal.error}</p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button type="button" onClick={handleInputModalClose} style={cancelBtnStyle}>
                Cancel
              </button>
              <button type="button" onClick={handleInputModalConfirm} disabled={inputModal.loading} style={confirmBtnStyle}>
                {inputModal.loading ? "Creating..." : `Create ${modalLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Inline styles for the modal (scoped, no class conflicts)
const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9999,
};

const modalBoxStyle = {
  background: "white", borderRadius: "16px", padding: "28px 32px",
  width: "100%", maxWidth: "420px",
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.12), 0 10px 10px -5px rgba(0,0,0,0.06)",
};

const inputStyle = {
  width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
  borderRadius: "8px", fontSize: "14px", outline: "none",
  transition: "border-color 0.2s", boxSizing: "border-box",
};

const cancelBtnStyle = {
  padding: "9px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
  background: "white", fontWeight: 600, color: "#6b7280", cursor: "pointer", fontSize: "14px",
};

const confirmBtnStyle = {
  padding: "9px 20px", borderRadius: "8px", border: "none",
  background: "#6366f1", color: "white", fontWeight: 600,
  cursor: "pointer", fontSize: "14px", opacity: 1, transition: "background 0.2s",
};

export default ClientDetailsForm;

