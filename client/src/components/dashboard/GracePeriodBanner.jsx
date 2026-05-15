import React, { useState, useEffect } from "react";
import { FaClock, FaExclamationTriangle, FaShieldAlt, FaArrowRight } from "react-icons/fa";

/**
 * GracePeriodBanner
 *
 * Displays a polished, premium countdown timer for the tenant's access period.
 */
const GracePeriodBanner = ({ tenant }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!tenant?.verifiedAt) return;

        const calculateTimeLeft = () => {
            const graceDays = tenant.accessGracePeriodDays ?? 30;
            const graceMs = graceDays * 24 * 60 * 60 * 1000;
            const expirationDate = new Date(tenant.verifiedAt).getTime() + graceMs;
            const now = Date.now();
            const diff = expirationDate - now;

            if (diff <= 0) {
                return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expirationDate };
            }

            return {
                total: diff,
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
                expirationDate
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [tenant?.verifiedAt, tenant?.accessGracePeriodDays]);

    if (!timeLeft || timeLeft.total <= 0) return null;

    // Visibility Logic: Only show the banner if less than 5 days remain
    if (timeLeft.days >= 5) return null;

    const isUrgent = timeLeft.days < 3;
    const formattedExpiry = new Date(timeLeft.expirationDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <div style={{
            ...styles.bannerWrapper,
            background: isUrgent
                ? "linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)"
                : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            borderColor: isUrgent ? "#fecaca" : "#e2e8f0",
        }}>
            {/* Accent Pattern */}
            <div style={{ ...styles.accentBlob, background: isUrgent ? "rgba(239, 68, 68, 0.05)" : "rgba(99, 102, 241, 0.05)" }}></div>

            <div style={styles.bannerContent}>
                <div style={styles.leftSection}>
                    <div style={{
                        ...styles.iconWrapper,
                        color: isUrgent ? "#ef4444" : "#6366f1",
                        background: isUrgent ? "rgba(239, 68, 68, 0.1)" : "rgba(99, 102, 241, 0.1)",
                    }}>
                        {isUrgent ? <FaExclamationTriangle /> : <FaShieldAlt />}
                    </div>

                    <div style={styles.textContainer}>
                        <div style={styles.titleRow}>
                            <span style={styles.badge}>{isUrgent ? "Action Required" : "Account Status"}</span>
                            <span style={styles.mainTitle}>{isUrgent ? "Access Expiring Soon" : "Active Access Period"}</span>
                        </div>
                        <p style={styles.subtext}>
                            Your organization's trial access will conclude on <strong>{formattedExpiry}</strong>.
                        </p>
                    </div>
                </div>

                <div style={styles.rightSection}>
                    <div style={styles.timerGrid}>
                        <TimerUnit value={timeLeft.days} label="Days" />
                        <span style={styles.timerColon}>:</span>
                        <TimerUnit value={timeLeft.hours.toString().padStart(2, '0')} label="Hrs" />
                        <span style={styles.timerColon}>:</span>
                        <TimerUnit value={timeLeft.minutes.toString().padStart(2, '0')} label="Min" />
                        {timeLeft.days < 1 && (
                            <>
                                <span style={styles.timerColon}>:</span>
                                <TimerUnit value={timeLeft.seconds.toString().padStart(2, '0')} label="Sec" />
                            </>
                        )}
                    </div>

                    <a href="mailto:feedback@forgegrid.in" style={styles.actionLink}>
                        Manage Plan <FaArrowRight style={{ marginLeft: '4px', fontSize: '0.7rem' }} />
                    </a>
                </div>
            </div>
        </div>
    );
};

const TimerUnit = ({ value, label }) => (
    <div style={styles.timerUnit}>
        <span style={styles.timerValue}>{value}</span>
        <span style={styles.timerLabel}>{label}</span>
    </div>
);

const styles = {
    bannerWrapper: {
        position: "relative",
        borderRadius: "20px",
        padding: "1.25rem 1.75rem",
        marginBottom: "1.5rem",
        border: "1px solid",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
    },
    accentBlob: {
        position: "absolute",
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        top: "-100px",
        right: "-50px",
        filter: "blur(40px)",
        pointerEvents: "none",
    },
    bannerContent: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
        flexWrap: "wrap",
        position: "relative",
        zIndex: 2,
    },
    leftSection: {
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
    },
    iconWrapper: {
        width: "48px",
        height: "48px",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.25rem",
    },
    textContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
    },
    titleRow: {
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
    },
    badge: {
        fontSize: "0.65rem",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        padding: "2px 8px",
        background: "rgba(0,0,0,0.05)",
        borderRadius: "6px",
        color: "#64748b",
    },
    mainTitle: {
        fontSize: "1rem",
        fontWeight: 800,
        color: "#0f172a",
        letterSpacing: "-0.01em",
    },
    subtext: {
        margin: 0,
        fontSize: "0.8125rem",
        color: "#64748b",
    },
    rightSection: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.5rem",
    },
    timerGrid: {
        display: "flex",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.6)",
        padding: "0.6rem 1.25rem",
        borderRadius: "14px",
        border: "1px solid rgba(255, 255, 255, 0.8)",
    },
    timerUnit: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: "36px",
    },
    timerValue: {
        fontSize: "1.1rem",
        fontWeight: 900,
        color: "#0f172a",
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1,
    },
    timerLabel: {
        fontSize: "0.6rem",
        fontWeight: 700,
        color: "#94a3b8",
        textTransform: "uppercase",
        marginTop: "2px",
    },
    timerColon: {
        fontSize: "1.25rem",
        fontWeight: 900,
        color: "#cbd5e1",
        margin: "0 8px",
        paddingBottom: "14px",
    },
    actionLink: {
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "#6366f1",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        transition: "color 0.2s",
    }
};

export default GracePeriodBanner;
