// client/src/pages/admin/BlogManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
    Plus, Search, Edit2, Trash2, Archive, Star,
    ExternalLink, Eye, ThumbsUp, MessageSquare, Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { toast } from "react-toastify";
import Sidebar from "../../components/SideBar";
import "./BlogManagement.css";

const BlogManagement = () => {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [counts, setCounts] = useState({ all: 0, draft: 0, published: 0, archived: 0 });
    const [stats, setStats] = useState({ totalViews: 0, totalLikes: 0, totalComments: 0 });

    const fetchBlogs = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                status: currentTab === "all" ? "" : currentTab,
                q: searchQuery
            };
            const res = await api.get("/admin/blogs", { params });
            if (res.data.success) {
                setBlogs(res.data.data);
                if (res.data.counts) setCounts(res.data.counts);
                if (res.data.aggregateStats) setStats(res.data.aggregateStats);
            }
        } catch (error) {
            toast.error("Failed to load blogs");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [currentTab, searchQuery]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    const handleToggleFeatured = async (id) => {
        try {
            const res = await api.patch(`/admin/blogs/${id}/featured`);
            if (res.data.success) {
                toast.success(res.data.data.isFeatured ? "Marked as Featured" : "Removed from Featured");
                fetchBlogs();
            }
        } catch (err) {
            toast.error("Failed to toggle featured");
        }
    };

    const handleArchive = async (id) => {
        if (!window.confirm("Archive this post? It will be hidden from the public feed.")) return;
        try {
            const res = await api.patch(`/admin/blogs/${id}`, { status: "archived" });
            if (res.data.success) {
                toast.success("Post archived");
                fetchBlogs();
            }
        } catch (err) {
            toast.error("Failed to archive");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("CRITICAL: Permanently delete this post? This cannot be undone.")) return;
        try {
            const res = await api.delete(`/admin/blogs/${id}`);
            if (res.data.success) {
                toast.success("Post deleted permanently");
                fetchBlogs();
            }
        } catch (err) {
            toast.error("Failed to delete post");
        }
    };

    const tabs = [
        { id: "all", label: "All Posts" },
        { id: "draft", label: "Drafts" },
        { id: "published", label: "Published" },
        { id: "archived", label: "Archived" },
    ];

    const StatCard = ({ icon, label, value }) => (
        <div className="bm-stat-card">
            <span className="bm-stat-label">{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--blog-accent)' }}>{icon}</span>
                <span className="bm-stat-value">{value.toLocaleString()}</span>
            </div>
        </div>
    );

    return (
        <div className="bm-page">
            <Sidebar />
            <main className="bm-content">
                <div className="bm-container">
                    <header className="bm-header">
                        <div className="bm-title">
                            <h1>Blog Management</h1>
                            <p>Create, curate, and analyze your platform's content.</p>
                        </div>
                        <button className="blog-btn blog-btn-primary blog-btn-pill" onClick={() => navigate("/blog/write")}>
                            <Plus size={18} /> New Article
                        </button>
                    </header>

                    <div className="bm-stats-grid">
                        <StatCard icon={<Eye size={20} />} label="Total Views" value={stats.totalViews} />
                        <StatCard icon={<ThumbsUp size={20} />} label="Total Likes" value={stats.totalLikes} />
                        <StatCard icon={<MessageSquare size={20} />} label="Total Comments" value={stats.totalComments} />
                        <StatCard icon={<Plus size={20} />} label="Total Stories" value={counts.all} />
                    </div>

                    <div className="bm-filter-row">
                        <div className="bm-tabs">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`bm-tab${currentTab === tab.id ? ' active' : ''}`}
                                    onClick={() => setCurrentTab(tab.id)}
                                >
                                    {tab.label}
                                    <span className="bm-tab-count">{counts[tab.id] || 0}</span>
                                </button>
                            ))}
                        </div>

                        <div className="bm-search">
                            <Search size={18} className="bm-search-icon" />
                            <input
                                className="bm-search-input"
                                placeholder="Search stories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bm-table-wrap">
                        <table className="bm-table">
                            <thead>
                                <tr>
                                    <th>Article</th>
                                    <th>Status</th>
                                    <th>Performance</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '60px' }}>
                                            <Loader2 className="blog-spin" size={32} color="var(--blog-accent)" />
                                        </td>
                                    </tr>
                                ) : blogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: 'var(--blog-slate-500)' }}>
                                            No articles found in this category.
                                        </td>
                                    </tr>
                                ) : (
                                    blogs.map(post => (
                                        <tr key={post._id}>
                                            <td>
                                                <div className="bm-post-info">
                                                    <img src={post.coverImage || '/placeholder.png'} className="bm-post-img" alt="" />
                                                    <div className="bm-post-text">
                                                        <Link to={`/blog/${post.slug}`} className="bm-post-title" target="_blank">
                                                            {post.title} <ExternalLink size={12} style={{ opacity: 0.5, marginLeft: 4 }} />
                                                        </Link>
                                                        <span className="bm-post-meta">In {post.category || 'Uncategorized'} • /{post.slug}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`blog-badge blog-badge-${post.status === 'published' ? 'success' : post.status === 'archived' ? 'danger' : 'neutral'}`}>
                                                    {post.status}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 16, color: 'var(--blog-slate-500)', fontSize: '0.8rem', fontWeight: 700 }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={14} /> {post.stats?.views || 0}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsUp size={14} /> {post.stats?.likes || 0}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="bm-actions">
                                                    <button
                                                        className={`bm-action-btn${post.isFeatured ? ' bm-star active' : ' bm-star'}`}
                                                        onClick={() => handleToggleFeatured(post._id)}
                                                        title="Toggle Featured"
                                                    >
                                                        <Star size={18} fill={post.isFeatured ? "currentColor" : "none"} />
                                                    </button>
                                                    <button
                                                        className="bm-action-btn"
                                                        onClick={() => navigate(`/blog/edit/${post._id}`)}
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="bm-action-btn"
                                                        onClick={() => handleArchive(post._id)}
                                                        title="Archive"
                                                        disabled={post.status === 'archived'}
                                                    >
                                                        <Archive size={16} />
                                                    </button>
                                                    <button
                                                        className="bm-action-btn bm-action-btn-danger"
                                                        onClick={() => handleDelete(post._id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BlogManagement;
