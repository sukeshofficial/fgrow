import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaLock, FaEnvelope, FaSignOutAlt, FaExclamationTriangle,
    FaBuilding, FaInfoCircle, FaCreditCard, FaHeadset
} from "react-icons/fa";
import SupportModal from "../components/ui/SupportModal";

/**
 * AccessRestricted
 *
 * Polished glassmorphism UI shown when access is denied.
 * Now includes navigation to Billing/Payment and in-app Support.
 */
const AccessRestricted = () => {
    const navigate = useNavigate();
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    // Read details stored by the axios interceptor
    const raw = sessionStorage.getItem("access_block_info");
    const info = raw ? JSON.parse(raw) : null;

    const isManual = info?.code === "ACCESS_RESTRICTED";
    const tenantName = info?.tenantName || "Your Organization";
    const reason = info?.reason;
    const daysOverdue = info?.daysOverdue;
    const gracePeriodDays = info?.gracePeriodDays ?? 30;
    const verifiedAt = info?.verifiedAt ? new Date(info.verifiedAt) : null;

    const handleLogout = async () => {
        try {
            const { api } = await import("../api/api");
            await api.post("/auth/logout");
        } catch (_) { /* ignore */ }
        sessionStorage.removeItem("access_block_info");
        navigate("/login");
    };

    return (
        <div style={styles.root}>
            {/* Dynamic Background Blobs */}
            <div style={styles.blob1}></div>
            <div style={styles.blob2}></div>

            <div style={styles.glassCard}>
                {/* Header Section */}
                <div style={styles.header}>
                    <div style={{ ...styles.iconWrap, background: isManual ? "rgba(245, 158, 11, 0.1)" : "rgba(99, 102, 241, 0.1)" }}>
                        {isManual
                            ? <FaExclamationTriangle size={32} style={{ color: "#f59e0b" }} />
                            : <FaLock size={28} style={{ color: "#6366f1" }} />
                        }
                    </div>
                    <div style={styles.tenantBadge}>
                        <FaBuilding style={{ marginRight: '6px', fontSize: '0.9rem' }} />
                        {tenantName}
                    </div>
                    <h1 style={styles.heading}>
                        {isManual ? "Access Restricted" : "Access Period Ended"}
                    </h1>
                    <p style={styles.subtext}>
                        {isManual
                            ? "Your organization's access has been temporarily suspended by an administrator."
                            : `The ${gracePeriodDays}-day access period for your organization has concluded.`
                        }
                    </p>
                </div>

                {/* Reason / Info Box */}
                {isManual && reason && (
                    <div style={styles.reasonBox}>
                        <div style={styles.reasonHeader}>
                            <FaInfoCircle style={{ marginRight: '8px' }} />
                            Reason for Restriction
                        </div>
                        <div style={styles.reasonContent}>
                            "{reason}"
                        </div>
                    </div>
                )}

                {/* Grace Period Stats */}
                {!isManual && (
                    <div style={styles.statsGrid}>
                        <div style={styles.statItem}>
                            <span style={styles.statLabel}>Approved</span>
                            <span style={styles.statValue}>
                                {verifiedAt ? verifiedAt.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }) : 'N/A'}
                            </span>
                        </div>
                        <div style={styles.statItem}>
                            <span style={styles.statLabel}>Period</span>
                            <span style={styles.statValue}>{gracePeriodDays} Days</span>
                        </div>
                        <div style={{ ...styles.statItem, borderColor: '#fee2e2' }}>
                            <span style={styles.statLabel}>Days Overdue</span>
                            <span style={{ ...styles.statValue, color: "#ef4444" }}>{daysOverdue || 0}</span>
                        </div>
                    </div>
                )}

                {/* Action Controls */}
                <div style={styles.actions}>
                    <button
                        onClick={() => navigate("/billing")}
                        style={styles.primaryBtn}
                    >
                        <FaCreditCard style={{ marginRight: "10px" }} /> Manage Plan / Pay Now
                    </button>

                    <button
                        onClick={() => setIsSupportOpen(true)}
                        style={styles.actionBtn}
                    >
                        <FaHeadset style={{ marginRight: "10px" }} /> Contact Support
                    </button>

                    <button onClick={handleLogout} style={styles.secondaryBtn}>
                        <FaSignOutAlt style={{ marginRight: "8px" }} /> Sign Out
                    </button>
                </div>

                <div style={styles.footer}>
                    Secure access managed by <strong>FGrow System Admin</strong>
                </div>
            </div>

            {isSupportOpen && (
                <SupportModal
                    isOpen={isSupportOpen}
                    onClose={() => setIsSupportOpen(false)}
                />
            )}
        </div>
    );
};

const styles = {
    root: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: "2rem",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
    },
    blob1: {
        position: "absolute",
        width: "500px",
        height: "500px",
        background: "linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)",
        borderRadius: "50%",
        top: "-100px",
        left: "-100px",
        filter: "blur(80px)",
        opacity: 0.6,
        zIndex: 1,
    },
    blob2: {
        position: "absolute",
        width: "400px",
        height: "400px",
        background: "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)",
        borderRadius: "50%",
        bottom: "-50px",
        right: "-50px",
        filter: "blur(80px)",
        opacity: 0.5,
        zIndex: 1,
    },
    glassCard: {
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "28px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
        padding: "3rem 2.5rem",
        maxWidth: "460px",
        width: "100%",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: "1.75rem",
        textAlign: "center",
    },
    header: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
    },
    iconWrap: {
        width: "72px",
        height: "72px",
        borderRadius: "22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "0.25rem",
        transform: "rotate(-5deg)",
        boxShadow: "0 8px 16px -4px rgba(0,0,0,0.05)",
    },
    tenantBadge: {
        padding: "6px 16px",
        background: "rgba(241, 245, 249, 0.8)",
        borderRadius: "100px",
        fontSize: "0.8rem",
        fontWeight: 700,
        color: "#64748b",
        display: "flex",
        alignItems: "center",
        border: "1px solid #e2e8f0",
    },
    heading: {
        margin: 0,
        fontSize: "1.75rem",
        fontWeight: 900,
        color: "#0f172a",
        letterSpacing: "-0.025em",
    },
    subtext: {
        margin: 0,
        fontSize: "0.9375rem",
        color: "#64748b",
        lineHeight: 1.6,
    },
    reasonBox: {
        background: "rgba(255, 255, 255, 0.4)",
        borderRadius: "20px",
        padding: "1.25rem",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        textAlign: "left",
    },
    reasonHeader: {
        fontSize: "0.75rem",
        fontWeight: 800,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: "0.75rem",
        display: "flex",
        alignItems: "center",
    },
    reasonContent: {
        fontSize: "0.9375rem",
        color: "#334155",
        lineHeight: 1.5,
        fontStyle: "italic",
        fontWeight: 500,
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem",
    },
    statItem: {
        background: "rgba(255, 255, 255, 0.4)",
        padding: "1rem",
        borderRadius: "16px",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
    },
    statLabel: {
        fontSize: "0.65rem",
        fontWeight: 700,
        color: "#94a3b8",
        textTransform: "uppercase",
    },
    statValue: {
        fontSize: "0.95rem",
        fontWeight: 800,
        color: "#1e293b",
    },
    actions: {
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
    },
    primaryBtn: {
        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        color: "#ffffff",
        padding: "1rem 1.5rem",
        borderRadius: "14px",
        fontWeight: 700,
        fontSize: "0.9375rem",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.2s, boxShadow 0.2s",
    },
    actionBtn: {
        background: "rgba(255, 255, 255, 0.6)",
        color: "#334155",
        padding: "0.9rem 1.5rem",
        borderRadius: "14px",
        fontWeight: 700,
        fontSize: "0.875rem",
        border: "1px solid #e2e8f0",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.2s",
    },
    secondaryBtn: {
        background: "transparent",
        border: "none",
        color: "#94a3b8",
        padding: "0.5rem 1.5rem",
        borderRadius: "14px",
        fontWeight: 600,
        fontSize: "0.875rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 0.2s",
    },
    footer: {
        fontSize: "0.75rem",
        color: "#94a3b8",
        paddingTop: "0.5rem",
        borderTop: "1px solid rgba(0, 0, 0, 0.03)",
    }
};

export default AccessRestricted;
