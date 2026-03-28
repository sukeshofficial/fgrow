import React, { useState, useEffect } from "react";
import { api } from "../../api/api.js";
import { FaCheckCircle, FaSpinner, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import TableSkeleton from "../../components/skeletons/TableSkeleton";
import "../../styles/AdvancedFilters.css";

const BugReportsList = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedImages, setSelectedImages] = useState(null); // For Lightbox
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' }; // Orange
            case 'resolved': return { bg: '#f0fdf4', color: '#15803d', border: '#dcfce7' }; // Green
            default: return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'bug': return '#ef4444';
            case 'feature_request': return '#8b5cf6';
            case 'general_feedback': return '#10b981';
            default: return '#6366f1';
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const resp = await api.get("/reports");
            const data = resp.data.data || (Array.isArray(resp.data) ? resp.data : null);
            if (data) {
                setReports(data);
            } else if (resp.data.success && resp.data.data) {
                setReports(resp.data.data);
            }
        } catch (err) {
            setError("Failed to load reports. Make sure you have Super Admin privileges.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            setUpdatingId(id);
            await api.put(`/reports/${id}/status`, { status: newStatus });
            fetchReports();
        } catch (err) {
            alert("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) return <div style={{ padding: '20px' }}><TableSkeleton rows={5} columns={4} /></div>;
    if (error) return <div className="staff-error">{error}</div>;

    return (
        <div className="staff-list-card no-margin">
            <div className="staff-table-container">
                {reports.length === 0 ? (
                    <div className="staff-loading">No bug reports or feedback found. System is squeaky clean!</div>
                ) : (
                    <table className="staff-table">
                        <thead>
                            <tr>
                                <th>Type & Title</th>
                                <th>Description</th>
                                <th>Screenshots</th>
                                <th>Reported By / Tenant</th>
                                <th>Date Submitted</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(report => (
                                <tr key={report._id} style={{
                                    opacity: report.status === 'resolved' ? 0.7 : 1,
                                    transition: 'all 0.2s'
                                }}>
                                    <td style={{ verticalAlign: 'middle', padding: '20px 16px' }}>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            background: `${getTypeColor(report.type)}15`,
                                            color: getTypeColor(report.type),
                                            marginBottom: '6px'
                                        }}>
                                            {report.type.replace('_', ' ')}
                                        </div>
                                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                                            {report.title}
                                        </div>
                                        <div style={{ marginTop: '8px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '999px',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.02em',
                                                background: getStatusStyle(report.status).bg,
                                                color: getStatusStyle(report.status).color,
                                                border: `1px solid ${getStatusStyle(report.status).border}`
                                            }}>
                                                {report.status}
                                            </span>
                                        </div>
                                    </td>

                                    <td style={{ verticalAlign: 'middle', padding: '20px 16px', maxWidth: '350px' }}>
                                        <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                            {report.description}
                                        </div>
                                    </td>

                                    <td style={{ verticalAlign: 'middle', padding: '20px 16px', textAlign: 'center' }}>
                                        {report.screenshots?.length > 0 ? (
                                            <div
                                                onClick={() => {
                                                    setSelectedImages(report.screenshots);
                                                    setCurrentImgIndex(0);
                                                }}
                                                style={{
                                                    position: 'relative',
                                                    width: '60px',
                                                    height: '60px',
                                                    margin: '0 auto',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {/* Stack Effect (only if more than 1) */}
                                                {report.screenshots.length > 1 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-4px',
                                                        right: '-4px',
                                                        width: '100%',
                                                        height: '100%',
                                                        background: '#bbd8ffff',
                                                        borderRadius: '8px',
                                                        zIndex: 1,
                                                        transform: 'rotate(3deg)'
                                                    }} />
                                                )}
                                                {report.screenshots.length > 2 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-8px',
                                                        right: '-8px',
                                                        width: '100%',
                                                        height: '100%',
                                                        background: '#73b0fbff',
                                                        borderRadius: '8px',
                                                        zIndex: 0,
                                                        transform: 'rotate(6deg)'
                                                    }} />
                                                )}

                                                {/* Main Thumbnail Card */}
                                                <div style={{
                                                    position: 'relative',
                                                    zIndex: 2,
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                                                    background: '#f1f5f9'
                                                }}>
                                                    <img
                                                        src={report.screenshots[0]}
                                                        alt="screenshot"
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    {report.screenshots.length > 1 && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: 0,
                                                            right: 0,
                                                            left: 0,
                                                            background: 'rgba(0, 0, 0, 0.33)',
                                                            color: 'white',
                                                            fontSize: '10px',
                                                            padding: '2px 0',
                                                            textAlign: 'center',
                                                            backdropFilter: 'blur(2px)'
                                                        }}>
                                                            +{report.screenshots.length - 1} photos
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#cbd5e1', fontSize: '12px' }}>No media</span>
                                        )}
                                    </td>

                                    <td style={{ verticalAlign: 'middle', padding: '20px 16px' }}>
                                        <div className="staff-info">
                                            <span className="staff-name" style={{ fontSize: '14px', fontWeight: '600' }}>{report.reportedBy?.name || 'Unknown User'}</span>
                                            <span className="staff-username" style={{ fontSize: '13px' }}>{report.tenantId?.name || 'Super Admin'}</span>
                                        </div>
                                    </td>

                                    <td style={{ verticalAlign: 'middle', padding: '20px 16px' }}>
                                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                                            {new Date(report.createdAt).toLocaleDateString()}
                                            <br />
                                            <small style={{ opacity: 0.7 }}>{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                        </span>
                                    </td>

                                    <td className="text-right" style={{ verticalAlign: 'middle', padding: '20px 16px' }}>
                                        {report.status !== 'resolved' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(report._id, 'resolved')}
                                                disabled={updatingId === report._id}
                                                className="filter-btn-primary"
                                                style={{
                                                    padding: '8px 18px',
                                                    fontSize: '13px',
                                                    borderRadius: '10px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    minHeight: 'unset',
                                                    background: '#6366f1',
                                                    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
                                                }}
                                            >
                                                {updatingId === report._id ? <FaSpinner className="fa-spin" /> : <FaCheckCircle />}
                                                Mark Resolved
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
                                                    <FaCheckCircle /> Resolved
                                                </span>
                                                <button
                                                    onClick={() => handleUpdateStatus(report._id, 'pending')}
                                                    disabled={updatingId === report._id}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#6366f1',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.target.style.background = '#eef2ff'}
                                                    onMouseOut={(e) => e.target.style.background = 'none'}
                                                >
                                                    {updatingId === report._id ? <FaSpinner className="fa-spin" /> : 'Reopen Issue'}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Carousel Modal (Lightbox) */}
            {selectedImages && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.69)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(12px)',
                        animation: 'fadeIn 0.3s ease'
                    }}
                    onClick={() => setSelectedImages(null)}
                >
                    {/* Header: Close / Index Indicator */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        padding: '24px 40px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
                        zIndex: 10,
                        
                    }}>
                        <div style={{ color: 'rgba(0,0,0,1)', fontSize: '16px', fontWeight: '500', opacity: 0.8, backgroundColor: 'hsla(237, 100%, 96%, 1.00)', padding: '5px 20px', borderRadius: '999px', }}>
                            Screenshot {currentImgIndex + 1} / {selectedImages.length}
                        </div>
                        <button
                            onClick={() => setSelectedImages(null)}
                            style={{
                                background: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '44px',
                                height: '44px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <FaTimes style={{ color: '#0f172a', fontSize: '20px' }} />
                        </button>
                    </div>

                    {/* Main Image Container */}
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '100px 40px'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {selectedImages.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentImgIndex((currentImgIndex - 1 + selectedImages.length) % selectedImages.length); }}
                                    style={{
                                        position: 'absolute',
                                        left: '40px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        zIndex: 5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    <FaChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentImgIndex((currentImgIndex + 1) % selectedImages.length); }}
                                    style={{
                                        position: 'absolute',
                                        right: '40px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        zIndex: 5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    <FaChevronRight size={20} />
                                </button>
                            </>
                        )}

                        <div style={{
                            position: 'relative',
                            maxWidth: '1200px',
                            width: '90%',
                            height: '90%',
                            maxHeight: '80vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}>
                            <img
                                src={selectedImages[currentImgIndex]}
                                alt="Full scale capture"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '16px',
                                    boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.8)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Bottom: Thumbnail Bar (Carousel Effect) */}
                    {selectedImages.length > 1 && (
                        <div style={{
                            position: 'absolute',
                            bottom: '32px',
                            display: 'flex',
                            gap: '12px',
                            padding: '12px 24px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 10
                        }}>
                            {selectedImages.map((src, i) => (
                                <div
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(i); }}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border: i === currentImgIndex ? '2px solid #6366f1' : '1px solid transparent',
                                        opacity: i === currentImgIndex ? 1 : 0.4,
                                        transition: 'all 0.2s',
                                        transform: i === currentImgIndex ? 'scale(1.1)' : 'scale(1)'
                                    }}
                                >
                                    <img src={src} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                    )}

                    <style>{`
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes slideIn { 
                            from { transform: translateY(20px); opacity: 0; } 
                            to { transform: translateY(0); opacity: 1; } 
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default BugReportsList;
