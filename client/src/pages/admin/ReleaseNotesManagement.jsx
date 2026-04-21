import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Button } from "../../components/ui/Button";
import { FaPlus, FaTrash, FaCheck, FaTimes, FaEye, FaClone, FaArchive, FaClock, FaUsers, FaGlobe, FaTag, FaImage, FaLink, FaListUl, FaMagic, FaTools, FaBoxOpen } from "react-icons/fa";
import { MdRocketLaunch, MdSettings, MdHistory, MdDescription, MdOutlineCampaign, MdSchedule, MdPublish, MdDrafts } from "react-icons/md";
import { Spinner } from "../../components/ui/Spinner";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ReleaseNotesModal from "../../components/ui/ReleaseNotesModal";

const ReleaseNotesManagement = () => {
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [editingRelease, setEditingRelease] = useState(null);

    // Form state (Full Production Model)
    const initialFormState = {
        version: "",
        type: "minor",
        title: "",
        summary: "",
        features: [""],
        status: "draft",
        audience: "all",
        publishAt: new Date().toISOString().slice(0, 16),
        expireAt: "",
        showOnLogin: true,
        showAsModal: true,
        showAsBanner: false,
        requireAcknowledgement: false,
        ctaLabel: "Got it, thanks!",
        ctaLink: "",
        icon: "",
        tags: "",
        imageUrl: "",
        versionLabel: "",
        priority: 0,
        internalNotes: "",
        changelogUrl: "",
        dismissible: true,
        autoOpenDelaySeconds: 0
    };

    const [form, setForm] = useState(initialFormState);

    useEffect(() => {
        fetchReleases();
    }, []);

    const fetchReleases = async () => {
        try {
            setLoading(true);
            const res = await api.get("/release-notes/all");
            setReleases(res.data);
        } catch (err) {
            console.error("Failed to fetch releases", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingRelease(null);
        setForm(initialFormState);
        setIsCreateModalOpen(true);
    };

    const formatForInput = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const handleOpenEdit = (release) => {
        setEditingRelease(release);
        setForm({
            ...release,
            publishAt: formatForInput(release.publishAt),
            expireAt: formatForInput(release.expireAt),
            tags: Array.isArray(release.tags) ? release.tags.join(", ") : ""
        });
        setIsCreateModalOpen(true);
    };

    const handleFeatureChange = (index, value) => {
        const updated = [...form.features];
        updated[index] = value;
        setForm({ ...form, features: updated });
    };

    const handleAddFeature = () => setForm({ ...form, features: [...form.features, ""] });
    const handleRemoveFeature = (index) => setForm({ ...form, features: form.features.filter((_, i) => i !== index) });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : undefined,
                expireAt: form.expireAt ? new Date(form.expireAt).toISOString() : undefined,
                features: form.features.filter(f => f.trim() !== ""),
                tags: typeof form.tags === 'string' ? form.tags.split(",").map(t => t.trim()).filter(t => t !== "") : form.tags
            };

            console.log("[ReleaseNotes] Saving payload:", payload);
            console.log("[ReleaseNotes] target URL:", editingRelease ? `/api/v0/release-notes/${editingRelease._id}` : "/api/v0/release-notes/create");

            if (editingRelease) {
                await api.patch(`/release-notes/${editingRelease._id}`, payload);
            } else {
                await api.post("/release-notes/create", payload);
            }

            setIsCreateModalOpen(false);
            fetchReleases();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (id) => {
        try {
            await api.patch(`/release-notes/${id}/toggle`);
            fetchReleases();
        } catch (err) {
            alert("Failed to toggle status");
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        setSubmitting(true);
        try {
            await api.delete(`/release-notes/${confirmDeleteId}`);
            setConfirmDeleteId(null);
            fetchReleases();
        } catch (err) {
            alert("Failed to delete");
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetForAll = async () => {
        setSubmitting(true);
        try {
            await api.post("/release-notes/reset-all");
            setIsResetConfirmOpen(false);
            alert("Success: All users will see the latest update again!");
        } catch (err) {
            alert("Failed to reset history");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'published': return { background: '#f0fdf4', color: '#10b981', dot: '#10b981' };
            case 'scheduled': return { background: '#eff6ff', color: '#3b82f6', dot: '#3b82f6' };
            case 'draft': return { background: '#f8fafc', color: '#64748b', dot: '#94a3b8' };
            case 'archived': return { background: '#fef2f2', color: '#ef4444', dot: '#ef4444' };
            default: return { background: '#f8fafc', color: '#64748b', dot: '#94a3b8' };
        }
    };

    return (
        <div className="release-notes-management" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Area */}
            <div className="admin-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Release Management</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.925rem' }}>Announce new features, schedule updates, and target specific audiences.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="secondary" onClick={() => setIsResetConfirmOpen(true)} style={{ color: '#ef4444', borderColor: '#fee2e2' }}>
                        <MdHistory style={{ marginRight: '8px' }} /> Global Reset
                    </Button>
                    <Button variant="primary" onClick={handleOpenCreate} style={{ padding: '12px 24px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)' }}>
                        <FaPlus style={{ marginRight: '8px' }} /> New Release
                    </Button>
                </div>
            </div>

            {/* List Table */}
            <div className="staff-list-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                <div className="table-responsive">
                    {loading ? (
                        <div style={{ padding: '80px', textAlign: 'center' }}><Spinner size="lg" /></div>
                    ) : releases.length === 0 ? (
                        <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>No releases found. Start by creating one.</div>
                    ) : (
                        <table className="staff-table">
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '18px 24px', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Release</th>
                                    <th style={{ padding: '18px 24px', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audience / Visibility</th>
                                    <th style={{ padding: '18px 24px', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule</th>
                                    <th style={{ padding: '18px 24px', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                    <th className="text-right" style={{ padding: '18px 24px', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {releases.map(release => {
                                    const style = getStatusStyle(release.status);
                                    return (
                                        <tr key={release._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        background: '#f1f5f9',
                                                        borderRadius: '10px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#475569'
                                                    }}>
                                                        {release.type === 'major' ? <MdRocketLaunch size={16} color="#2563eb" /> : release.type === 'minor' ? <FaMagic size={14} color="#0d9488" /> : <FaTools size={13} color="#475569" />}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.925rem' }}>{release.title}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Version: {release.version}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FaUsers size={10} /> {release.audience}
                                                    </span>
                                                    {release.showAsModal && <span style={{ padding: '2px 8px', background: '#eff6ff', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, color: '#2563eb' }}>Modal</span>}
                                                    {release.showAsBanner && <span style={{ padding: '2px 8px', background: '#fefce8', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, color: '#854d0e' }}>Banner</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.8125rem' }}>
                                                    <FaClock size={12} color="#94a3b8" />
                                                    {new Date(release.publishAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    background: style.background,
                                                    color: style.color,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot }} />
                                                    {release.status}
                                                </div>
                                            </td>
                                            <td className="text-right" style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleOpenEdit(release)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                                                    <button onClick={() => setConfirmDeleteId(release._id)} style={{ background: '#fff', border: '1px solid #fee2e2', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Overhauled Create/Edit Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <div className="animate-pop" style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '1100px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{editingRelease ? 'Update Release Note' : 'Create High-Impact Release'}</h3>
                                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '4px 0 0 0' }}>Define features, target audiences, and schedule publishing.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setIsPreviewOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#eff6ff', border: 'none', color: '#2563eb', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                                    <FaEye size={16} /> Preview
                                </button>
                                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - 2 Columns */}
                        <form onSubmit={handleSubmit} style={{ overflow: 'hidden', display: 'flex', flex: 1 }}>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', borderRight: '1px solid #f1f5f9' }}>
                                {/* Section 1: Basic Info */}
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>
                                        <MdDescription size={20} color="#2563eb" /> Basic Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Release Title</label>
                                            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="tenant-input" style={{ width: '100%', fontSize: '0.925rem' }} placeholder="e.g. Revolutionary Dashboard update" />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Version</label>
                                            <input type="text" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} required className="tenant-input" style={{ width: '100%' }} placeholder="v1.4.0" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Release Type</label>
                                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="tenant-input" style={{ width: '100%', appearance: 'auto' }}>
                                                <option value="major">Major (Big Feature)</option>
                                                <option value="minor">Minor (Improvements)</option>
                                                <option value="patch">Patch (Bug Fixes)</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Short Summary</label>
                                            <input type="text" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} className="tenant-input" style={{ width: '100%' }} placeholder="Quick 1-sentence overview" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Highlights */}
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>
                                        <FaListUl size={18} color="#2563eb" /> Release Highlights
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {form.features.map((f, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '12px' }}>
                                                <input type="text" value={f} onChange={e => handleFeatureChange(i, e.target.value)} required className="tenant-input" style={{ flex: 1 }} placeholder="Feature description..." />
                                                {form.features.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveFeature(i)} style={{ width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '12px', cursor: 'pointer' }}>
                                                        <FaTrash size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={handleAddFeature} style={{ width: '100%', padding: '12px', border: '1px dashed #cbd5e1', background: '#f8fafc', borderRadius: '12px', color: '#64748b', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <FaPlus size={12} /> Add Highlight
                                        </button>
                                    </div>
                                </div>

                                {/* Section 3: Visuals & Attachments */}
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>
                                        <FaImage size={18} color="#2563eb" /> Visuals & Rich Media
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Cover Image URL</label>
                                            <input type="text" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="tenant-input" style={{ width: '100%' }} placeholder="https://..." />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Primary CTA Label</label>
                                            <input type="text" value={form.ctaLabel} onChange={e => setForm({ ...form, ctaLabel: e.target.value })} className="tenant-input" style={{ width: '100%' }} placeholder="Got it, thanks!" />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>CTA Link URL <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                                            <input type="url" value={form.ctaLink} onChange={e => setForm({ ...form, ctaLink: e.target.value })} className="tenant-input" style={{ width: '100%' }} placeholder="https://..." />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>Changelog URL <span style={{ color: '#94a3b8', fontWeight: 400 }}>(shows "View full changelog" link)</span></label>
                                            <input type="url" value={form.changelogUrl} onChange={e => setForm({ ...form, changelogUrl: e.target.value })} className="tenant-input" style={{ width: '100%' }} placeholder="https://..." />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Configuration */}
                            <div style={{ width: '380px', background: '#f8fafc', padding: '32px', overflowY: 'auto' }}>
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, marginBottom: '16px', fontSize: '0.925rem' }}>
                                        <MdSettings size={18} color="#2563eb" /> Visibility & Status
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Workflow Status</label>
                                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="tenant-input" style={{ width: '100%', appearance: 'auto', background: '#fff' }}>
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="scheduled">Scheduled</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Target Audience</label>
                                        <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="tenant-input" style={{ width: '100%', appearance: 'auto', background: '#fff' }}>
                                            <option value="all">Everyone</option>
                                            <option value="admins">Admins Only</option>
                                            <option value="owners">Organization Owners</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, marginBottom: '16px', fontSize: '0.925rem' }}>
                                        <FaClock size={16} color="#2563eb" /> Scheduling
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Publish Date</label>
                                        <input type="datetime-local" value={form.publishAt} onChange={e => setForm({ ...form, publishAt: e.target.value })} className="tenant-input" style={{ width: '100%', background: '#fff' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Expiration Date</label>
                                        <input type="datetime-local" value={form.expireAt} onChange={e => setForm({ ...form, expireAt: e.target.value })} className="tenant-input" style={{ width: '100%', background: '#fff' }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, marginBottom: '16px', fontSize: '0.925rem' }}>
                                        <MdOutlineCampaign size={20} color="#2563eb" /> Display Options
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#1e293b', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={form.showAsModal} onChange={e => setForm({ ...form, showAsModal: e.target.checked })} style={{ width: '18px', height: '18px' }} /> Show as Modal
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#1e293b', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={form.showAsBanner} onChange={e => setForm({ ...form, showAsBanner: e.target.checked })} style={{ width: '18px', height: '18px' }} /> Show as Banner
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#1e293b', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={form.requireAcknowledgement} onChange={e => setForm({ ...form, requireAcknowledgement: e.target.checked })} style={{ width: '18px', height: '18px' }} /> Require Acknowledgement
                                        </label>
                                    </div>
                                </div>

                                <div className="btn-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '40px' }}>
                                    <Button type="submit" variant="primary" disabled={submitting} style={{ padding: '14px', borderRadius: '14px', fontWeight: 700, background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                                        {submitting ? <Spinner size="sm" /> : editingRelease ? 'Update Release' : 'Publish Release'}
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)} style={{ padding: '14px', borderRadius: '14px' }}>Discard Changes</Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Live Preview Modal */}
            {isPreviewOpen && (
                <ReleaseNotesModal
                    release={{
                        ...form,
                        features: form.features.filter(f => f.trim() !== ""),
                        status: 'published' // Ensure it shows in preview
                    }}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}

            {confirmDeleteId && (
                <ConfirmModal
                    title="Delete Release Note"
                    message="Are you sure you want to delete this release note? This action cannot be undone."
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                    submitting={submitting}
                />
            )}

            {isResetConfirmOpen && (
                <ConfirmModal
                    title="Reset History for ALL?"
                    message="This will force the latest relevant release to show up for every single user. Continue?"
                    onConfirm={handleResetForAll}
                    onCancel={() => setIsResetConfirmOpen(false)}
                    submitting={submitting}
                />
            )}
        </div>
    );
};

export default ReleaseNotesManagement;
