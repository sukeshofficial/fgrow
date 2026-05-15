import React, { useState } from "react";
import { FaTimes, FaCamera, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import { api } from "../../api/api";

/**
 * PaymentProofModal
 * 
 * Specialized modal for collecting Transaction ID and Screenshot Proof.
 * Submits to the SupportRequest backend with type 'payment_proof'.
 */
const PaymentProofModal = ({ isOpen, onClose, totalAmount }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        transactionId: "",
        body: `Payment for subscription: ₹${totalAmount}`,
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
        if (!formData.transactionId || !formData.screenshot) {
            toast.error("Please provide both Transaction ID and Screenshot Proof");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append("type", "payment_proof");
            data.append("title", `Payment Proof: ₹${totalAmount}`);
            data.append("body", formData.body);
            data.append("transactionId", formData.transactionId);
            data.append("screenshot", formData.screenshot);

            await api.post("/support", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Payment proof submitted! Our team will verify it shortly.");
            onClose();
        } catch (error) {
            console.error("Proof submission error:", error);
            toast.error(error.response?.data?.message || "Failed to submit proof");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Submit Payment Proof</h2>
                        <p style={styles.subtitle}>Verified manually by Admin (₹{totalAmount})</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><FaTimes /></button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Transaction ID / UTR No.</label>
                        <input
                            type="text"
                            placeholder="e.g. 412389654210"
                            style={styles.input}
                            value={formData.transactionId}
                            onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Payment Screenshot</label>
                        <div style={styles.uploadArea}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={styles.fileInput}
                                id="payment-screenshot"
                            />
                            <label htmlFor="payment-screenshot" style={styles.uploadLabel}>
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
                        <p style={styles.hint}>Ensure the amount and transaction ID are clearly visible.</p>
                    </div>

                    <button type="submit" disabled={loading} style={styles.submitBtn}>
                        {loading ? <FaSpinner className="spinner" /> : <><FaCheckCircle style={{ marginRight: '8px' }} /> Submit Proof</>}
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
    subtitle: {
        margin: "0.25rem 0 0",
        fontSize: "0.875rem",
        color: "#64748b",
        fontWeight: 500,
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
    },
    uploadArea: {
        position: "relative",
        height: "150px",
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
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
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
        boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.3)",
    }
};

export default PaymentProofModal;
