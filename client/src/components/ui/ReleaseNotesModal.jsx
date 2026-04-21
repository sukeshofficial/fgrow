import React from "react";
import { Button } from "./Button";
import { FaTimes, FaMagic, FaTools, FaExternalLinkAlt, FaChevronRight } from "react-icons/fa";
import { MdRocketLaunch } from "react-icons/md";

const ReleaseNotesModal = ({ release, onClose }) => {
    if (!release) return null;

    const getIcon = () => {
        switch (release.type) {
            case 'major': return <MdRocketLaunch size={20} />;
            case 'minor': return <FaMagic size={20} />;
            case 'patch': return <FaTools size={20} />;
            default: return <MdRocketLaunch size={20} />;
        }
    };

    const getGradient = () => {
        switch (release.type) {
            case 'major': return '#2563eb';
            case 'minor': return '#0d9488';
            case 'patch': return '#475569';
            default: return '#2563eb';
        }
    };

    const handleCTA = () => {
        if (release.ctaLink) {
            window.open(release.ctaLink, "_blank");
        }
        onClose();
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div className="modal-content animate-pop" style={{
                background: '#fff',
                borderRadius: '28px',
                width: '100%',
                maxWidth: '580px',
                maxHeight: '85vh',
                boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.4)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Close Button */}
                {release.dismissible && !release.requireAcknowledgement && (
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(255,255,255,0.9)',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            width: '28px',
                            height: '28px',
                            borderRadius: '999px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 20,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <FaTimes size={12} />
                    </button>
                )}

                {/* Hero / Header Area (Static) */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    {release.imageUrl ? (
                        <div style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                            <img src={release.imageUrl} alt="Release Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '-28px',
                                left: '32px',
                                width: '56px',
                                height: '56px',
                                background: getGradient(),
                                color: '#fff',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                                border: '3px solid #fff',
                                zIndex: 10
                            }}>
                                {getIcon()}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '32px 32px 0' }}>
                            <div style={{
                                width: '58px',
                                height: '58px',
                                background: getGradient(),
                                color: '#fff',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
                            }}>
                                {getIcon()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Body (Scrollable) */}
                <div style={{
                    padding: release.imageUrl ? '44px 32px 32px' : '24px 32px 32px',
                    overflowY: 'auto',
                    flex: 1,
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none'
                }}>
                    <style>{`
                        .modal-content div::-webkit-scrollbar { display: none; }
                    `}</style>
                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            background: release.type === 'major' ? '#eff6ff' : release.type === 'minor' ? '#f0fdf4' : '#f8fafc',
                            color: release.type === 'major' ? '#2563eb' : release.type === 'minor' ? '#10b981' : '#64748b',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            border: `1px solid ${release.type === 'major' ? '#dbeafe' : release.type === 'minor' ? '#dcfce7' : '#e2e8f0'}`
                        }}>
                            {release.type}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>v {release.version}</span>
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                        {release.title}
                    </h2>

                    {release.summary && (
                        <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.5, marginBottom: '24px' }}>
                            {release.summary}
                        </p>
                    )}

                    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', marginBottom: '32px' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>What's included:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {release.features.map((feature, i) => (
                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{
                                        marginTop: '5px',
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: '#fff',
                                        border: '1.5px solid #3b82f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3b82f6' }} />
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500, lineHeight: 1.4 }}>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', position: 'sticky', bottom: 0, background: '#fff', paddingTop: '16px' }}>
                        <Button
                            variant="primary"
                            onClick={handleCTA}
                            style={{
                                flex: 2,
                                padding: '14px',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                background: getGradient(),
                                borderRadius: '999px',
                                boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {release.ctaLabel || "Discover More"}
                            {release.ctaLink ? <FaExternalLinkAlt size={12} /> : <FaChevronRight size={12} />}
                        </Button>
                        {!release.requireAcknowledgement && (
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    borderRadius: '999px',
                                    color: '#64748b',
                                    background: '#f1f5f9',
                                    border: 'none'
                                }}
                            >
                                Dismiss
                            </Button>
                        )}
                    </div>
                    {release.changelogUrl && (
                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <a href={release.changelogUrl} rel="noopener noreferrer" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6', textDecoration: 'none' }}>
                                View full changelog
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ReleaseNotesModal;
