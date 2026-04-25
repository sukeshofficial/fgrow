import React, { useState } from "react";
import {
    Palette,
    Zap,
    Sparkles,
    MessageCircle,
    PenLine,
    Star,
    X,
    Loader2,
    UserCircle2,
    Building2,
    Mail,
} from "lucide-react";
import { api } from "../../api/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import "../../styles/AdvancedFilters.css";

/* ─── Category definitions ──────────────────────────────────────────────── */
const CATEGORIES = [
    { id: "UI/UX", label: "UI / UX", Icon: Palette },
    { id: "Performance", label: "Performance", Icon: Zap },
    { id: "Features", label: "Features", Icon: Sparkles },
    { id: "Support", label: "Support", Icon: MessageCircle },
    { id: "Other", label: "Other", Icon: PenLine },
];

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

/* ─── Reusable avatar component ─────────────────────────────────────────── */
const Avatar = ({ src, name, size = 40 }) => {
    const initials = name
        ? name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "?";

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "2px solid #e0e7ff",
                }}
            />
        );
    }

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: size * 0.38,
                fontWeight: "700",
                flexShrink: 0,
                letterSpacing: "-0.02em",
            }}
        >
            {initials}
        </div>
    );
};

/* ─── Main component ─────────────────────────────────────────────────────── */
const FeedbackModal = ({ isOpen, onClose }) => {
    const { user, avatar, tenant } = useAuth();

    const [category, setCategory] = useState("UI/UX");
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    /* ── Reset & close ──────────────────────────────────────────────────── */
    const handleClose = () => {
        setCategory("UI/UX");
        setRating(0);
        setHover(0);
        setComment("");
        setError("");
        setSuccess(false);
        onClose();
    };

    /* ── Submit ─────────────────────────────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Please give a star rating before submitting.");
            return;
        }
        try {
            setSubmitting(true);
            setError("");
            await api.post("/feedback", {
                category,
                rating,
                comment,
                metadata: {
                    userName: user?.name || "",
                    email: user?.email || "",
                    tenantName: tenant?.name || "",
                    userId: user?._id || user?.id || "",
                },
            });
            setSuccess(true);
            setTimeout(handleClose, 2400);
        } catch (err) {
            setError(err.response?.data?.message || "Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Derived ─────────────────────────────────────────────────────────── */
    const activeRating = hover || rating;
    const ratingLabel = RATING_LABELS[activeRating] || "";

    /* ─────────────────────────────────────────────────────────────────────── */
    return (
        <div
            style={overlayStyle}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div style={cardStyle}>

                {/* ── Header ────────────────────────────────────────────────────── */}
                <div style={headerStyle}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                            Share Your Feedback
                        </h2>
                        <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#94a3b8" }}>
                            Help us make FGrow better for you
                        </p>
                    </div>
                    <button style={closeBtnStyle} onClick={handleClose} aria-label="Close">
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* ── Success state ────────────────────────────────────────────── */}
                {success ? (
                    <div style={{ padding: "52px 24px", textAlign: "center" }}>
                        <div style={successIconStyle}>
                            <svg width="28" height="28" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 style={{ color: "#0f172a", margin: "0 0 8px", fontSize: "18px", fontWeight: "700" }}>
                            Thank you!
                        </h3>
                        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", maxWidth: "280px", margin: "0 auto" }}>
                            Your feedback has been received and will help us improve.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: "22px" }}>

                            {/* ── User Context ───────────────────────────────────────── */}
                            <div style={userBannerStyle}>
                                <Avatar src={avatar} name={user?.name} size={44} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a", truncate: true }}>
                                        {user?.name || "Unknown User"}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px", flexWrap: "wrap", gap: "8px" }}>
                                        <span style={metaPillStyle}>
                                            <Mail size={11} strokeWidth={2} />
                                            {user?.email || "—"}
                                        </span>
                                        {tenant?.name && (
                                            <span style={metaPillStyle}>
                                                <Building2 size={11} strokeWidth={2} />
                                                {tenant.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Error ─────────────────────────────────────────────── */}
                            {error && (
                                <div style={errorBannerStyle}>{error}</div>
                            )}

                            {/* ── Category ──────────────────────────────────────────── */}
                            <div>
                                <label style={labelStyle}>Category</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "10px" }}>
                                    {CATEGORIES.map(({ id, label, Icon }) => {
                                        const active = category === id;
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => setCategory(id)}
                                                style={categoryBtnStyle(active)}
                                                title={label}
                                            >
                                                <Icon
                                                    size={20}
                                                    strokeWidth={active ? 2.5 : 1.8}
                                                    style={{ color: active ? "#4f46e5" : "#94a3b8", transition: "color 0.15s" }}
                                                />
                                                <span style={{ fontSize: "10px", fontWeight: active ? "700" : "500", color: active ? "#4f46e5" : "#64748b", letterSpacing: "0.01em", lineHeight: 1.2 }}>
                                                    {label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Rating ────────────────────────────────────────────── */}
                            <div>
                                <label style={labelStyle}>
                                    Rating
                                    {ratingLabel && (
                                        <span style={{ fontWeight: "600", color: "#6366f1", marginLeft: "8px" }}>
                                            — {ratingLabel}
                                        </span>
                                    )}
                                </label>
                                <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const filled = star <= activeRating;
                                        return (
                                            <Star
                                                key={star}
                                                size={34}
                                                strokeWidth={1.5}
                                                fill={filled ? "#f59e0b" : "none"}
                                                stroke={filled ? "#f59e0b" : "#d1d5db"}
                                                style={{
                                                    cursor: "pointer",
                                                    transform: filled ? "scale(1.15)" : "scale(1)",
                                                    transition: "transform 0.12s, fill 0.1s, stroke 0.1s",
                                                }}
                                                onMouseEnter={() => setHover(star)}
                                                onMouseLeave={() => setHover(0)}
                                                onClick={() => setRating(star)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Comment ───────────────────────────────────────────── */}
                            <div>
                                <label style={labelStyle}>
                                    Comment
                                    <span style={{ fontWeight: "400", color: "#94a3b8", marginLeft: "4px" }}>(optional)</span>
                                </label>
                                <textarea
                                    style={textareaStyle}
                                    placeholder="Tell us more about your experience…"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    maxLength={2000}
                                    onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                                    onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                                />
                                {comment.length > 0 && (
                                    <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right", marginTop: "4px" }}>
                                        {comment.length} / 2000
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Footer ────────────────────────────────────────────────── */}
                        <div style={footerStyle}>
                            <button type="button" style={cancelBtnStyle} onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || rating === 0}
                                style={submitBtnStyle(submitting || rating === 0)}
                            >
                                {submitting
                                    ? (<><Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> Submitting…</>)
                                    : "Submit Feedback"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const overlayStyle = {
    position: "fixed", inset: 0,
    background: "rgba(15,23,42,0.55)",
    backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 3000, padding: "16px",
};

const cardStyle = {
    background: "#ffffff",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 24px 48px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
    animation: "fadeSlideUp 0.28s cubic-bezier(0.16,1,0.3,1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
};

const headerStyle = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "22px 24px 20px",
    borderBottom: "1px solid #f1f5f9",
};

const closeBtnStyle = {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "999px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#64748b",
    flexShrink: 0,
    transition: "all 0.15s",
};

const userBannerStyle = {
    display: "flex",
    alignItems: "center",
    marginTop: "10px",
    gap: "14px",
    padding: "14px 16px",
    background: "linear-gradient(135deg, #f8f8ff, #f0f4ff)",
    borderRadius: "12px",
    border: "1px solid #e0e7ff",
};

const metaPillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "500",
};

const labelStyle = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    display: "block",
};

const categoryBtnStyle = (active) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px 6px",
    border: active ? "2px solid #6366f1" : "1.5px solid #e2e8f0",
    borderRadius: "12px",
    background: active ? "#eef2ff" : "#fafafa",
    cursor: "pointer",
    transition: "all 0.15s",
    outline: "none",
});

const textareaStyle = {
    width: "100%",
    marginTop: "10px",
    minHeight: "96px",
    resize: "vertical",
    padding: "10px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    lineHeight: "1.6",
    transition: "border-color 0.2s, box-shadow 0.2s",
};

const footerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "18px 24px",
    marginTop: "6px",
    borderTop: "1px solid #f1f5f9",
};

const cancelBtnStyle = {
    padding: "9px 18px",
    border: "1.5px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s",
};

const submitBtnStyle = (disabled) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "9px 20px",
    background: disabled ? "#c7d2fe" : "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    boxShadow: disabled ? "none" : "0 4px 12px rgba(99,102,241,0.35)",
});

const successIconStyle = {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
};

const errorBannerStyle = {
    padding: "10px 14px",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: "8px",
    fontSize: "13px",
    border: "1px solid #fecaca",
    fontWeight: "500",
};

export default FeedbackModal;
