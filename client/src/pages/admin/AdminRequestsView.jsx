import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import {
    FaCheckCircle, FaExclamationCircle, FaImage,
    FaChevronDown, FaChevronUp, FaExternalLinkAlt, FaSpinner
} from "react-icons/fa";
import { toast } from "react-toastify";
import TableSkeleton from "../../components/skeletons/TableSkeleton";

/**
 * AdminRequestsView
 * 
 * Super Admin Inbox for managing Support Tickets and Payment Proofs.
 */
const AdminRequestsView = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [resolvingId, setResolvingId] = useState(null);
    const [adminResponse, setAdminResponse] = useState("");

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get("/support/all");
            setRequests(res.data);
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (requestId) => {
        try {
            setResolvingId(requestId);
            await api.patch(`/support/${requestId}/resolve`, {
                status: "resolved",
                adminResponse
            });
            toast.success("Request marked as resolved");
            setAdminResponse("");
            setExpandedId(null);
            fetchRequests();
        } catch (error) {
            console.error("Error resolving request:", error);
            toast.error("Failed to resolve request");
        } finally {
            setResolvingId(null);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}><TableSkeleton rows={5} columns={5} /></div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>All Requests & Payment Proofs</h2>
                <span style={styles.countBadge}>{requests.length} total</span>
            </div>

            <div style={styles.requestList}>
                {requests.length === 0 ? (
                    <div style={styles.empty}>No pending requests found.</div>
                ) : (
                    requests.map((req) => {
                        const isExpanded = expandedId === req._id;
                        const isPayment = req.type === "payment_proof";

                        return (
                            <div key={req._id} style={{
                                ...styles.requestCard,
                                borderColor: isExpanded ? "#6366f1" : "#e2e8f0",
                                boxShadow: isExpanded ? "0 10px 25px -5px rgba(0,0,0,0.1)" : "none"
                            }}>
                                <div
                                    style={styles.cardHeader}
                                    onClick={() => setExpandedId(isExpanded ? null : req._id)}
                                >
                                    <div style={styles.headerMain}>
                                        <div style={{
                                            ...styles.typeBadge,
                                            background: isPayment ? "#fef2f2" : "#f0f9ff",
                                            color: isPayment ? "#ef4444" : "#0369a1"
                                        }}>
                                            {isPayment ? "Payment Proof" : "Support Ticket"}
                                        </div>
                                        <div style={styles.tenantInfo}>
                                            <span style={styles.tenantName}>{req.tenantId?.name}</span>
                                            <span style={styles.userName}>by {req.userId?.full_name}</span>
                                        </div>
                                    </div>

                                    <div style={styles.headerSecondary}>
                                        <span style={{
                                            ...styles.statusBadge,
                                            background: req.status === "pending" ? "#fff7ed" : "#f0fdf4",
                                            color: req.status === "pending" ? "#ea580c" : "#16a34a"
                                        }}>
                                            {req.status}
                                        </span>
                                        <span style={styles.date}>{new Date(req.createdAt).toLocaleDateString()}</span>
                                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={styles.cardBody}>
                                        <h3 style={styles.reqTitle}>{req.title}</h3>
                                        <p style={styles.reqBody}>{req.body}</p>

                                        {isPayment && req.transactionId && (
                                            <div style={styles.txBox}>
                                                <strong>Transaction ID:</strong> {req.transactionId}
                                            </div>
                                        )}

                                        {req.screenshotUrl && (
                                            <div style={styles.screenshotArea}>
                                                <div style={styles.screenshotHeader}>
                                                    <FaImage style={{ marginRight: '8px' }} /> Proof Attachment
                                                    <a
                                                        href={req.screenshotUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={styles.viewFullLink}
                                                    >
                                                        <FaExternalLinkAlt size={12} /> View Full
                                                    </a>
                                                </div>
                                                <img src={req.screenshotUrl} alt="Proof" style={styles.screenshot} />
                                            </div>
                                        )}

                                        {req.status === "pending" && (
                                            <div style={styles.resolveArea}>
                                                <textarea
                                                    placeholder="Internal admin note or response to tenant..."
                                                    style={styles.textarea}
                                                    value={adminResponse}
                                                    onChange={(e) => setAdminResponse(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleResolve(req._id)}
                                                    disabled={resolvingId === req._id}
                                                    style={styles.resolveBtn}
                                                >
                                                    {resolvingId === req._id ? <FaSpinner className="spinner" /> : <><FaCheckCircle style={{ marginRight: '8px' }} /> Mark Resolved</>}
                                                </button>
                                            </div>
                                        )}

                                        {req.status === "resolved" && req.adminResponse && (
                                            <div style={styles.responseBox}>
                                                <strong>Admin Response:</strong> "{req.adminResponse}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: "1rem",
        maxWidth: "1200px",
        margin: "0 auto",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2rem",
    },
    title: {
        margin: 0,
        fontSize: "1.5rem",
        fontWeight: 800,
        color: "#0f172a",
    },
    countBadge: {
        padding: "4px 12px",
        background: "#f1f5f9",
        borderRadius: "100px",
        fontSize: "0.875rem",
        fontWeight: 600,
        color: "#64748b",
    },
    requestList: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    empty: {
        textAlign: "center",
        padding: "4rem",
        color: "#94a3b8",
        fontSize: "1.125rem",
    },
    requestCard: {
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        transition: "all 0.2s",
    },
    cardHeader: {
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
    },
    headerMain: {
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
    },
    typeBadge: {
        padding: "4px 10px",
        borderRadius: "8px",
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.025em",
    },
    tenantInfo: {
        display: "flex",
        flexDirection: "column",
    },
    tenantName: {
        fontSize: "1rem",
        fontWeight: 700,
        color: "#1e293b",
    },
    userName: {
        fontSize: "0.8125rem",
        color: "#64748b",
    },
    headerSecondary: {
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        color: "#94a3b8",
    },
    statusBadge: {
        padding: "4px 12px",
        borderRadius: "100px",
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "capitalize",
    },
    date: {
        fontSize: "0.875rem",
    },
    cardBody: {
        padding: "0 1.5rem 1.5rem",
        borderTop: "1px solid #f8fafc",
        animation: "slideDown 0.3s ease-out",
    },
    reqTitle: {
        margin: "1.5rem 0 0.5rem",
        fontSize: "1.125rem",
        fontWeight: 800,
        color: "#0f172a",
    },
    reqBody: {
        margin: 0,
        fontSize: "0.9375rem",
        color: "#475569",
        lineHeight: 1.6,
    },
    txBox: {
        marginTop: "1rem",
        padding: "0.75rem 1rem",
        background: "#f1f5f9",
        borderRadius: "10px",
        fontSize: "0.875rem",
        color: "#1e293b",
        border: "1px solid #e2e8f0",
    },
    screenshotArea: {
        marginTop: "1.5rem",
        background: "#f8fafc",
        borderRadius: "14px",
        padding: "1rem",
        border: "1px solid #f1f5f9",
    },
    screenshotHeader: {
        fontSize: "0.8125rem",
        fontWeight: 700,
        color: "#64748b",
        marginBottom: "1rem",
        display: "flex",
        alignItems: "center",
    },
    viewFullLink: {
        marginLeft: "auto",
        color: "#6366f1",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    screenshot: {
        width: "100%",
        maxHeight: "400px",
        objectFit: "contain",
        borderRadius: "8px",
        background: "#fff",
    },
    resolveArea: {
        marginTop: "2rem",
        paddingTop: "1.5rem",
        borderTop: "1px dashed #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    textarea: {
        padding: "1rem",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        fontSize: "0.875rem",
        minHeight: "80px",
        outline: "none",
        resize: "vertical",
    },
    resolveBtn: {
        alignSelf: "flex-end",
        background: "#16a34a",
        color: "#fff",
        padding: "0.75rem 1.5rem",
        borderRadius: "10px",
        fontWeight: 700,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        fontSize: "0.875rem",
        transition: "background 0.2s",
    },
    responseBox: {
        marginTop: "1.5rem",
        padding: "1rem",
        background: "#f0fdf4",
        border: "1px solid #dcfce7",
        borderRadius: "10px",
        fontSize: "0.875rem",
        color: "#166534",
        fontStyle: "italic",
    }
};

export default AdminRequestsView;
