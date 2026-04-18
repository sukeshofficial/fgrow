import React, { useState } from "react";
import { FaBug, FaLightbulb, FaCommentAlt, FaSpinner, FaTimes, FaCloudUploadAlt } from "react-icons/fa";
import { api } from "../../api/api.js";

import "../../styles/AdvancedFilters.css"; // Reuse the premium modal styles

const ReportIssueModal = ({ isOpen, onClose }) => {
    const [type, setType] = useState("bug");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [screenshots, setScreenshots] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (screenshots.length + files.length > 5) {
            alert("Maximum 5 screenshots allowed");
            return;
        }

        const newScreenshots = [...screenshots, ...files];
        setScreenshots(newScreenshots);

        // Generate previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeScreenshot = (index) => {
        const newScreenshots = [...screenshots];
        newScreenshots.splice(index, 1);
        setScreenshots(newScreenshots);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setError("Please enter both title and description.");
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("type", type);
            formData.append("title", title);
            formData.append("description", description);

            screenshots.forEach((file) => {
                formData.append("screenshots", file);
            });

            await api.post("/reports", formData);
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setTitle("");
                setDescription("");
                setType("bug");
                setScreenshots([]);
                setPreviews([]);
                setSuccess(false);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit report. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="filter-modal-overlay">
            <div className="filter-modal-container" style={{ maxWidth: '500px' }}>
                <div className="filter-modal-header">
                    <h3><FaBug style={{ marginRight: '8px', color: '#6366f1' }} /> Report an Issue</h3>
                    <button className="filter-close-btn" onClick={onClose}><FaTimes /></button>
                </div>

                {success ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>Report Submitted!</h3>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>Thank you for your feedback. Our team will review it shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="filter-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {error && <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', border: '1px solid #fecaca' }}>{error}</div>}

                            <div>
                                <label className="filter-label">Report Type</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
                                    {['bug', 'feature_request', 'general_feedback'].map(t => (
                                        <div
                                            key={t}
                                            onClick={() => setType(t)}
                                            style={{
                                                padding: '10px',
                                                textAlign: 'center',
                                                borderRadius: '8px',
                                                border: type === t ? '2px solid #6366f1' : '1px solid #e2e8f0',
                                                background: type === t ? '#eef2ff' : 'white',
                                                color: type === t ? '#4f46e5' : '#64748b',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {t.replace('_', ' ')}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="filter-label">Title <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    type="text"
                                    className="report-input-styled"
                                    placeholder="E.g., Cannot upload logo in Settings"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="filter-form-group">
                                <label className="filter-label">Description <span style={{ color: '#ef4444' }}>*</span></label>
                                <textarea
                                    className="report-input-styled"
                                    style={{ minHeight: '120px', resize: 'vertical' }}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Please provide details to help us reproduce the issue..."
                                    required
                                />
                            </div>

                            <div className="filter-form-group">
                                <label className="filter-label">Screenshots (Optional)</label>
                                <div className="screenshot-upload-container" style={{
                                    border: '2px dashed #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    background: '#f8fafc',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }} onClick={() => document.getElementById('screenshot-input').click()}>
                                    <input
                                        id="screenshot-input"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <FaCloudUploadAlt style={{ fontSize: '32px', color: '#6366f1', marginBottom: '8px' }} />
                                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                                        Click to upload screenshots (Max 5)
                                    </p>
                                </div>

                                {previews.length > 0 && (
                                    <div className="screenshot-previews" style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                                        {previews.map((url, index) => (
                                            <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                                <img src={url} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removeScreenshot(index); }} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="filter-modal-footer">
                            <div style={{ flex: 1 }}></div>
                            <div className="filter-footer-btns">
                                <button type="submit" className="filter-btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {submitting ? <FaSpinner className="fa-spin" /> : null}
                                    Submit Report
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReportIssueModal;
