import React, { useState, useEffect } from "react";
import { getSubscribers, triggerLaunchAnnouncement } from "../../api/launch.api";
import { Button } from "../../components/ui/Button";
import { FaRocket, FaUsers, FaEnvelope, FaExclamationTriangle } from "react-icons/fa";
import ConfirmModal from "../../components/ui/ConfirmModal";
import TableSkeleton from "../../components/skeletons/TableSkeleton";

const LaunchManagement = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        try {
            setLoading(true);
            const response = await getSubscribers();
            setSubscribers(response.data);
        } catch (err) {
            setError("Failed to fetch launch subscribers.");
        } finally {
            setLoading(false);
        }
    };

    const handleTrigger = async () => {
        try {
            setSubmitting(true);
            const response = await triggerLaunchAnnouncement();
            setResult(response.data);
            setIsTriggerModalOpen(false);
            fetchSubscribers();
        } catch (err) {
            alert("Trigger failed: " + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const stats = {
        total: subscribers.length,
        notified: subscribers.filter(s => s.notified).length,
        pending: subscribers.filter(s => !s.notified).length
    };

    return (
        <div className="launch-management">
            <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', marginBottom: '12px' }}>
                        <div style={{ background: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '10px' }}>
                            <FaUsers size={18} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Total Subscribers</span>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a' }}>{stats.total}</div>
                </div>

                <div className="stat-card" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', marginBottom: '12px' }}>
                        <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px', borderRadius: '10px' }}>
                            <FaEnvelope size={18} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Emails Sent</span>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a' }}>{stats.notified}</div>
                </div>

                <div className="stat-card" style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', marginBottom: '12px' }}>
                        <div style={{ background: '#fff7ed', color: '#c2410c', padding: '8px', borderRadius: '10px' }}>
                            <FaRocket size={18} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Pending Launch</span>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a' }}>{stats.pending}</div>
                </div>
            </div>

            <div className="admin-controls" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Subscribers</h2>
                    <button
                        onClick={fetchSubscribers}
                        className="filter-tabs-btn"
                        style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#f1f5f9' }}
                    >
                        ↻ Refresh
                    </button>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setIsTriggerModalOpen(true)}
                    disabled={stats.pending === 0 || submitting}
                    style={{
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        padding: '10px 24px',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                    }}
                >
                    <FaRocket style={{ marginRight: '8px' }} /> Trigger Launch Email Now
                </Button>
            </div>

            {result && (
                <div style={{
                    marginBottom: '24px',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    color: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                    <div>
                        <strong style={{ display: 'block', marginBottom: '2px' }}>Dispatch Status</strong>
                        <span style={{ fontSize: '0.9rem' }}>{result.message}</span>
                    </div>
                </div>
            )}

            <div className="staff-list-card no-margin" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                <div className="staff-table-container">
                    {loading ? (
                        <div style={{ padding: '20px' }}>
                            <TableSkeleton rows={5} columns={4} />
                        </div>
                    ) : error ? (
                        <div className="staff-error" style={{ color: '#ef4444', padding: '20px', textAlign: 'center' }}>{error}</div>
                    ) : subscribers.length === 0 ? (
                        <div className="staff-loading" style={{ color: '#64748b', padding: '40px', textAlign: 'center' }}>No launch subscribers yet.</div>
                    ) : (
                        <table className="staff-table">
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ color: '#475569', fontWeight: 600 }}>Email Address</th>
                                    <th style={{ color: '#475569', fontWeight: 600 }}>Notification Status</th>
                                    <th style={{ color: '#475569', fontWeight: 600 }}>IP Address</th>
                                    <th className="text-right" style={{ color: '#475569', fontWeight: 600 }}>Joined On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscribers.map((sub) => (
                                    <tr key={sub._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td>
                                            <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.925rem' }}>{sub.email}</div>
                                        </td>
                                        <td>
                                            <span className={`staff-role-badge ${sub.notified ? 'verified' : 'pending'}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                                {sub.notified ? 'Email Sent' : 'Queued'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{sub.ipAddress || '—'}</span>
                                        </td>
                                        <td className="text-right">
                                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                {new Date(sub.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {isTriggerModalOpen && (
                <ConfirmModal
                    title="Trigger Launch Email"
                    message={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p>Are you sure you want to trigger the launch announcement email to <strong>{stats.pending} pending subscribers</strong>?</p>
                            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', gap: '10px' }}>
                                <FaExclamationTriangle style={{ flexShrink: 0, marginTop: '2px' }} />
                                <p style={{ fontSize: '0.875rem', margin: 0 }}>This action will immediately send emails using your Nodemailer configuration. This cannot be undone.</p>
                            </div>
                        </div>
                    }
                    confirmLabel="Trigger Dispatch"
                    onConfirm={handleTrigger}
                    onCancel={() => setIsTriggerModalOpen(false)}
                    submitting={submitting}
                />
            )}
        </div>
    );
};

export default LaunchManagement;
