// client/src/pages/blog/BlogEditor/BlogEditor.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Save, Send, Eye, ArrowLeft, Loader2,
    X, Clock, Type, Hash, Globe, FileText, Check
} from "lucide-react";
import { api } from "../../../api/api";
import MarkdownRenderer from "../../../components/blog/ReaderContent/MarkdownRenderer";
import "./BlogEditor.css";

const BlogEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        summary: "",
        content: "",
        category: "Product",
        tags: [],
        coverImage: "",
        visibility: "public",
        status: "draft",
        readingTime: 1
    });

    const [showDraftPrompt, setShowDraftPrompt] = useState(false);
    const [localDraft, setLocalDraft] = useState(null);

    const textareaRef = useRef(null);
    const autosaveTimer = useRef(null);

    // Draft persistence
    useEffect(() => {
        if (hasUnsavedChanges) {
            const timer = setTimeout(() => {
                localStorage.setItem(`fgrow_draft_${id || 'new'}`, JSON.stringify(formData));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [formData, hasUnsavedChanges, id]);

    // Check for draft on mount
    useEffect(() => {
        const saved = localStorage.getItem(`fgrow_draft_${id || 'new'}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.content && parsed.content.length > 20) {
                    setLocalDraft(parsed);
                    setShowDraftPrompt(true);
                }
            } catch (_) { }
        }
    }, [id]);

    const restoreDraft = () => {
        if (localDraft) {
            setFormData(localDraft);
            setHasUnsavedChanges(true);
            setShowDraftPrompt(false);
        }
    };

    const discardDraft = () => {
        localStorage.removeItem(`fgrow_draft_${id || 'new'}`);
        setShowDraftPrompt(false);
    };

    // Load existing post
    const fetchPost = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/blogs/${id}`);
            if (res.data.success) {
                setFormData(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching post:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchPost();
    }, [id, fetchPost]);

    // Auto-generate slug
    useEffect(() => {
        if (!id && formData.title && !formData.slugModified) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.title, id, formData.slugModified]);

    // Reading time
    useEffect(() => {
        const words = formData.content.trim().split(/\s+/).length;
        const time = Math.max(1, Math.ceil(words / 200));
        setFormData(prev => ({ ...prev, readingTime: time }));
    }, [formData.content]);

    // Autosave Logic
    const performSave = useCallback(async (isAuto = true) => {
        if (!hasUnsavedChanges && isAuto) return;
        if (saving) return;

        try {
            if (!isAuto) setSaving(true);
            const endpoint = id ? `/admin/blogs/${id}` : "/admin/blogs";
            const method = id ? 'patch' : 'post';

            const payload = { ...formData };
            delete payload.slugModified;
            delete payload._id;
            delete payload.authorId;
            delete payload.stats;
            delete payload.createdAt;
            delete payload.updatedAt;
            delete payload.__v;
            delete payload.userReaction;

            const res = await api[method](endpoint, payload);
            if (res.data.success) {
                setHasUnsavedChanges(false);
                setLastSaved(new Date());
                localStorage.removeItem(`fgrow_draft_${id || 'new'}`);
                if (!id && res.data.data._id) {
                    // If first save of a new post, redirect to edit URL to continue
                    navigate(`/blog/edit/${res.data.data._id}`, { replace: true });
                }
            }
        } catch (err) {
            console.error("Save error:", err);
            const msg = err.response?.data?.message || err.message;
            alert(`Failed to save: ${msg}`);
        } finally {
            setSaving(false);
        }
    }, [formData, hasUnsavedChanges, id, navigate, saving]);

    useEffect(() => {
        if (hasUnsavedChanges) {
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
            autosaveTimer.current = setTimeout(() => {
                performSave(true);
            }, 3000);
        }
        return () => clearTimeout(autosaveTimer.current);
    }, [hasUnsavedChanges, performSave]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'slug' ? { slugModified: true } : {})
        }));
        setHasUnsavedChanges(true);
    };

    const addTag = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            const tag = tagInput.trim().replace(/,/g, '');
            if (!formData.tags.includes(tag)) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                setHasUnsavedChanges(true);
            }
            setTagInput("");
        }
    };

    const removeTag = (tag) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
        setHasUnsavedChanges(true);
    };

    if (loading) {
        return (
            <div className="be-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="blog-spin" size={40} color="var(--blog-accent)" />
            </div>
        );
    }

    return (
        <div className="be-page">
            {showDraftPrompt && (
                <div className="be-modal-overlay">
                    <div className="be-modal">
                        <div className="be-modal-icon"><Clock size={32} /></div>
                        <h3>Draft Recovery</h3>
                        <p>An unsaved version of this story was found. Would you like to restore it or start fresh?</p>
                        <div className="be-modal-actions">
                            <button className="blog-btn blog-btn-primary" onClick={restoreDraft}>
                                Restore Draft
                            </button>
                            <button className="blog-btn blog-btn-ghost" onClick={discardDraft}>
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <header className="be-header">
                <div className="be-header-left">
                    <Link to="/admin/blogs" className="blog-btn blog-btn-ghost blog-btn-sm">
                        <ArrowLeft size={16} /> Dashboard
                    </Link>
                    <div style={{ width: 1, height: 24, background: 'var(--blog-border)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--blog-text-primary)' }}>
                        {id ? 'Edit Article' : 'New Story'}
                    </span>
                    {lastSaved && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--blog-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} color="#10b981" /> Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    {hasUnsavedChanges && (
                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>• Unsaved</span>
                    )}
                </div>

                <div className="be-header-right">
                    <select
                        className="be-input"
                        style={{ width: 120, padding: '6px 12px', fontSize: '0.85rem' }}
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>

                    <button
                        className="blog-btn blog-btn-ghost blog-btn-pill"
                        onClick={() => setShowPreviewModal(true)}
                    >
                        <Eye size={18} /> Preview
                    </button>

                    <button
                        className="blog-btn blog-btn-primary blog-btn-pill"
                        onClick={() => performSave(false)}
                        disabled={saving || !hasUnsavedChanges}
                    >
                        {saving ? <Loader2 className="blog-spin" size={18} /> : <Save size={18} />}
                        {id ? 'Save Changes' : 'Publish Story'}
                    </button>
                </div>
            </header>

            <main className="be-main">
                {/* Editor */}
                <section className="be-editor-panel">
                    <div className="be-form">
                        <input
                            className="be-input be-title-input"
                            placeholder="Post Title..."
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="be-field">
                                <label><Type size={12} /> Slug</label>
                                <input className="be-input" name="slug" value={formData.slug} onChange={handleInputChange} />
                            </div>
                            <div className="be-field">
                                <label>Category</label>
                                <select className="be-input" name="category" value={formData.category} onChange={handleInputChange}>
                                    <option value="Product">Product</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Announcements">Announcements</option>
                                    <option value="Design">Design</option>
                                    <option value="Community">Community</option>
                                </select>
                            </div>
                        </div>

                        <div className="be-field">
                            <label>Summary</label>
                            <textarea
                                className="be-input be-textarea"
                                placeholder="A short snippet to entice readers..."
                                name="summary"
                                value={formData.summary}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="be-field">
                            <label>Cover Image URL</label>
                            <input className="be-input" name="coverImage" value={formData.coverImage} onChange={handleInputChange} placeholder="https://unsplash.com/..." />
                        </div>

                        <div className="be-field">
                            <label><Hash size={12} /> Tags</label>
                            <div className="be-tags-input">
                                {formData.tags.map(tag => (
                                    <span key={tag} className="be-tag-pill">
                                        {tag} <X size={12} className="be-tag-remove" onClick={() => removeTag(tag)} />
                                    </span>
                                ))}
                                <input
                                    className="be-tags-field"
                                    placeholder="Add tag and press Enter..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={addTag}
                                />
                            </div>
                        </div>

                        <div className="be-field">
                            <label><Globe size={12} /> Visibility</label>
                            <select className="be-input" name="visibility" value={formData.visibility} onChange={handleInputChange}>
                                <option value="public">Public</option>
                                <option value="members-only">Members Only</option>
                            </select>
                        </div>

                        <div className="be-field">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label><FileText size={12} /> Content (Markdown)</label>
                                <div className="be-reading-time"><Clock size={14} /> {formData.readingTime} min read</div>
                            </div>
                            <textarea
                                className="be-input be-textarea"
                                style={{ minHeight: 400, fontFamily: 'var(--blog-font-mono)', fontSize: '0.9rem' }}
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                placeholder="Once upon a time in FGrow..."
                            />
                        </div>
                    </div>
                </section>

                {/* Live Preview Modal */}
                <AnimatePresence>
                    {showPreviewModal && (
                        <motion.div
                            className="be-preview-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPreviewModal(false)}
                        >
                            <motion.div
                                className="be-preview-panel"
                                initial={{ y: 20, scale: 0.98, opacity: 0 }}
                                animate={{ y: 0, scale: 1, opacity: 1 }}
                                exit={{ y: 20, scale: 0.98, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <button className="be-preview-close" onClick={() => setShowPreviewModal(false)}>
                                    <X size={20} />
                                </button>

                                <div className="be-preview-inner">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--blog-slate-500)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 40, letterSpacing: '0.05em' }}>
                                        <Eye size={16} /> LIVE PREVIEW
                                    </div>

                                    {formData.coverImage && (
                                        <img src={formData.coverImage} alt="" style={{ width: '100%', borderRadius: 16, marginBottom: 32 }} />
                                    )}

                                    <header className="be-preview-header" style={{ borderColor: 'var(--blog-slate-200)' }}>
                                        {formData.category && <span className="blog-badge blog-badge-primary" style={{ marginBottom: 16 }}>{formData.category}</span>}
                                        <h1 className="be-preview-title">{formData.title || "Untitled Masterpiece"}</h1>
                                        <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: 'var(--blog-slate-500)', fontWeight: 600 }}>
                                            <span>{formData.readingTime} min read</span>
                                            <span>·</span>
                                            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    </header>

                                    <MarkdownRenderer content={formData.content} />

                                    <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {formData.tags.map(t => <span key={t} className="bd-tag">#{t}</span>)}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default BlogEditor;
