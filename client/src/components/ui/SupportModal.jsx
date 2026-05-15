import React, { useState } from "react";
import { FaTimes, FaCamera, FaPaperPlane, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import { api } from "../../api/api";

/**
 * SupportModal
 * 
 * A premium modal for sending in-app messages with screenshot attachments.
 * Used for general support and billing inquiries.
 */
const SupportModal = ({ isOpen, onClose, initialType = "support" }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        body: "",
        screenshot: null,
    });
    const [preview, setPreview] = useState(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("File size must be less than 2MB");
                return;
            }
            setFormData({ ...formData, screenshot: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.body) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append("type", initialType);
            data.append("title", formData.title);
            data.append("body", formData.body);
            if (formData.screenshot) {
                data.append("screenshot", formData.screenshot);
            }

            await api.post("/support", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Message sent successfully! We'll get back to you soon.");
            onClose();
        } catch (error) {
            console.error("Support submission error:", error);
            toast.error(error.response?.data?.message || "Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Contact Support</h2>
                    <button onClick={onClose} style={styles.closeBtn}><FaTimes /></button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Subject / Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Payment inquiry, Bug report..."
                            style={styles.input}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>How can we help?</label>
                        <textarea
                            placeholder="Provide as much detail as possible..."
                            style={styles.textarea}
                            rows={5}
                            value={formData.body}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Attachment (optional)</label>
                        <div style={styles.uploadArea}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={styles.fileInput}
                                id="support-screenshot"
                            />
                            <label htmlFor="support-screenshot" style={styles.uploadLabel}>
                                {preview ? (
                                    <img src={preview} alt="Preview" style={styles.previewImg} />
                                ) : (
                                    <div style={styles.uploadPlaceholder}>
                                        <FaCamera size={24} style={{ marginBottom: '8px', color: '#94a3b8' }} />
                                        <span>Upload Screenshot</span>
                                    </div>
                                )}
                            </label>
                        </div>
                        <p style={styles.hint}>Max size: 2MB (JPG, PNG, WebP)</p>
                    </div>

                    <button type="submit" disabled={loading} style={styles.submitBtn}>
                        {loading ? <FaSpinner className="spinner" /> : <><FaPaperPlane style={{ marginRight: '8px' }} /> Send Message</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
    },
    modal: {
        background: "#ffffff",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "500px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
        animation: "modalFadeIn 0.3s ease-out",
    },
    header: {
        padding: "1.5rem 2rem",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        margin: 0,
        fontSize: "1.25rem",
        fontWeight: 800,
        color: "#0f172a",
    },
    closeBtn: {
        background: "none",
        border: "none",
        fontSize: "1.25rem",
        color: "#94a3b8",
        cursor: "pointer",
        padding: "4px",
        display: "flex",
    },
    form: {
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
    },
    label: {
        fontSize: "0.875rem",
        fontWeight: 700,
        color: "#475569",
    },
    input: {
        padding: "0.875rem 1rem",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        fontSize: "0.9375rem",
        fontFamily: "inherit",
        outline: "none",
        transition: "border-color 0.2s",
    },
    textarea: {
        padding: "0.875rem 1rem",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        fontSize: "0.9375rem",
        fontFamily: "inherit",
        outline: "none",
        resize: "none",
        transition: "border-color 0.2s",
    },
    uploadArea: {
        position: "relative",
        height: "120px",
        background: "#f8fafc",
        borderRadius: "14px",
        border: "2px dashed #e2e8f0",
        overflow: "hidden",
    },
    fileInput: {
        position: "absolute",
        width: "0.1px",
        height: "0.1px",
        opacity: 0,
    },
    uploadLabel: {
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },
    uploadPlaceholder: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontSize: "0.8125rem",
        color: "#64748b",
        fontWeight: 500,
    },
    previewImg: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
    },
    hint: {
        margin: 0,
        fontSize: "0.75rem",
        color: "#94a3b8",
    },
    submitBtn: {
        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        color: "#ffffff",
        padding: "1rem",
        borderRadius: "14px",
        fontWeight: 700,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1rem",
        boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)",
    }
};

export default SupportModal;
