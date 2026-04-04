import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { FaTimes, FaSpinner } from "react-icons/fa";

import "../../styles/contactsalesmodal.css";

const ContactSalesModal = ({ isOpen, onClose, initialData }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        companyName: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: initialData?.name || "",
                email: initialData?.email || "",
                companyName: initialData?.companyName || "", // Pre-fill if available
            });
            setSuccess(false);
            setErrors({});
            setLoading(false);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Full Name is required";
        if (!formData.email.trim()) newErrors.email = "Work Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Valid email is required";
        if (!formData.companyName.trim()) newErrors.companyName = "Company Name is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);

        try {
            await api.post("/leads", formData);
            setSuccess(true);
        } catch (err) {
            setErrors({ api: err.response?.data?.message || "Something went wrong. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="c-modal-overlay" onClick={handleBackdropClick}>
            <div className={`c-modal-content ${success ? 'success-state' : ''}`}>
                <button className="c-modal-close" onClick={onClose} aria-label="Close modal">
                    <FaTimes />
                </button>

                {!success ? (
                    <div className="c-modal-body">
                        <h2>Contact Sales</h2>
                        <p className="c-modal-sub">Tell us a bit about yourself, and we'll get right to scheduling your demo.</p>

                        <form onSubmit={handleSubmit} className="c-modal-form">
                            {errors.api && <div className="c-error-banner">{errors.api}</div>}

                            <div className="c-form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Jane Doe"
                                    className={errors.name ? "c-input-error" : ""}
                                    autoFocus
                                />
                                {errors.name && <span className="c-error-text">{errors.name}</span>}
                            </div>

                            <div className="c-form-group">
                                <label>Work Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                    placeholder="jane@company.com"
                                    className={errors.email ? "c-input-error" : ""}
                                />
                                {errors.email && <span className="c-error-text">{errors.email}</span>}
                            </div>

                            <div className="c-form-group">
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))}
                                    placeholder="Acme Corp"
                                    className={errors.companyName ? "c-input-error" : ""}
                                />
                                {errors.companyName && <span className="c-error-text">{errors.companyName}</span>}
                            </div>

                            <button type="submit" className="c-btn-submit" disabled={loading}>
                                {loading ? <FaSpinner className="c-spinner" /> : "Continue to Schedule"}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="c-modal-success-state">
                        <div className="c-modal-body" style={{ paddingBottom: 16 }}>
                            <h2>Schedule your Demo</h2>
                            <p className="c-modal-sub">Pick a time that works best for you below!</p>
                        </div>
                        <div className="calendly-frame-wrap" style={{ height: "500px", width: "100%" }}>
                            <iframe
                                src={`https://calendly.com/sukesh-official-2006/30min?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}`}
                                width="100%"
                                height="90%"
                                frameBorder="0"
                                title="Calendly Scheduling"
                            ></iframe>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactSalesModal;
