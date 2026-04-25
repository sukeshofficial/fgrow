import React, { useState, useEffect } from "react";
import { api } from "../../api/api.js";
import {
    MessageSquare,
    Star,
    AlertCircle,
    Palette,
    Zap,
    Sparkles,
    MessageCircle,
    PenLine,
    Filter,
    X,
    Search,
    MoreVertical,
    CheckCircle2,
    Clock,
    Trash2,
    Settings,
} from "lucide-react";
import TableSkeleton from "../../components/skeletons/TableSkeleton";
import "../../styles/AdvancedFilters.css";

const CATEGORY_MAP = {
    "UI/UX": { label: "UI / UX", icon: Palette, color: "#9333ea", bg: "#faf5ff" },
    Performance: { label: "Performance", icon: Zap, color: "#ea580c", bg: "#fff7ed" },
    Features: { label: "Features", icon: Sparkles, color: "#2563eb", bg: "#eff6ff" },
    Support: { label: "Support", icon: MessageCircle, color: "#059669", bg: "#ecfdf5" },
    Other: { label: "Other", icon: PenLine, color: "#475569", bg: "#f8fafc" },
};

const STATUS_MAP = {
    new: { label: "New", color: "#2563eb", bg: "#dbeafe" },
    reviewed: { label: "Reviewed", color: "#059669", bg: "#d1fae5" },
    archived: { label: "Archived", color: "#64748b", bg: "#f1f5f9" },
};

const StarDisplay = ({ rating, size = 16 }) => (
    <div style={{ display: "flex", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((s) => (
            <Star
                key={s}
                size={size}
                fill={s <= rating ? "#f59e0b" : "none"}
                stroke={s <= rating ? "#f59e0b" : "#cbd5e1"}
                strokeWidth={2}
            />
        ))}
    </div>
);

const Avatar = ({ src, name, size = 36 }) => {
    const initials = name
        ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
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
                    border: "1px solid #e2e8f0",
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
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: size * 0.4,
                fontWeight: "700",
                flexShrink: 0,
            }}
        >
            {initials}
        </div>
    );
};

const formatTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const FeedbackList = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stats, setStats] = useState({ averageRating: 0, totalFeedbacks: 0 });
    const [updatingId, setUpdatingId] = useState(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterRating, setFilterRating] = useState("");
    const [search, setSearch] = useState("");

    // Drawer
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    // Popover menu
    const [openMenuId, setOpenMenuId] = useState(null);

    // Settings
    const [showSettings, setShowSettings] = useState(false);
    const [intervalValue, setIntervalValue] = useState(10);
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        api.get("/system/settings/public").then(res => {
            if (res.data?.data?.feedback_logout_interval !== undefined) {
                setIntervalValue(res.data.data.feedback_logout_interval);
            }
        }).catch(() => { });
    }, []);

    const handleSaveSettings = async () => {
        try {
            setSavingSettings(true);
            await api.patch("/system/settings", { feedback_logout_interval: parseInt(intervalValue, 10) });
            setShowSettings(false);
        } catch (err) {
            alert("Failed to save setting");
        } finally {
            setSavingSettings(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, [filterStatus, filterCategory, filterRating]);

    useEffect(() => {
        const handleWindowClick = () => setOpenMenuId(null);
        window.addEventListener("click", handleWindowClick);
        return () => window.removeEventListener("click", handleWindowClick);
    }, []);

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterCategory) params.category = filterCategory;
            if (filterRating) params.rating = filterRating;

            const resp = await api.get("/feedback/admin", { params });
            setFeedbacks(resp.data.data || []);
            setStats(resp.data.stats || { averageRating: 0, totalFeedbacks: 0 });
        } catch (err) {
            setError("Failed to load feedback. Make sure you have Super Admin privileges.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            setUpdatingId(id);
            await api.patch(`/feedback/admin/${id}`, { status: newStatus });
            setFeedbacks((prev) =>
                prev.map((fb) => (fb._id === id ? { ...fb, status: newStatus } : fb))
            );
            if (selectedFeedback && selectedFeedback._id === id) {
                setSelectedFeedback(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            alert("Failed to update status.");
        } finally {
            setUpdatingId(null);
            setOpenMenuId(null);
        }
    };

    const clearFilters = () => {
        setFilterStatus("");
        setFilterCategory("");
        setFilterRating("");
        setSearch("");
    };

    const hasFilters = filterStatus || filterCategory || filterRating || search;

    const filteredFeedbacks = feedbacks.filter((fb) => {
        if (!search) return true;
        const lowerSearch = search.toLowerCase();
        const name = (fb.user_id?.name || "").toLowerCase();
        const email = (fb.user_id?.email || "").toLowerCase();
        const commentText = (fb.comment || "").toLowerCase();
        return name.includes(lowerSearch) || email.includes(lowerSearch) || commentText.includes(lowerSearch);
    });

    if (loading) return <div style={{ padding: "20px" }}><TableSkeleton rows={5} columns={5} /></div>;
    if (error) return <div className="staff-error">{error}</div>;

    return (
        <div style={{ padding: "0" }}>
            {/* ── Stats Row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                <StatCard
                    icon={MessageSquare}
                    label="Total Feedback"
                    value={stats.totalFeedbacks}
                    color="#6366f1"
                    bg="#eef2ff"
                />
                <StatCard
                    icon={Star}
                    label="Average Rating"
                    value={`${stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"}`}
                    color="#f59e0b"
                    bg="#fef3c7"
                    suffix="/ 5.0"
                />
                <StatCard
                    icon={AlertCircle}
                    label="Unreviewed Feedback"
                    value={feedbacks.filter(f => f.status === "new").length}
                    color="#ef4444"
                    bg="#fef2f2"
                />
            </div>

            {/* ── Card Container ── */}
            <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>

                {/* ── Filters Toolbar ── */}
                <div style={{ borderRadius: "16px 16px 0 0", padding: "16px 20px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>

                    {/* Search */}
                    <div style={{ position: "relative", flex: "1 1 240px", minWidth: "200px" }}>
                        <Search size={16} strokeWidth={2.5} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or comment..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={searchInputStyle}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <Filter size={16} style={{ color: "#94a3b8" }} />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
                            <option value="">All Statuses</option>
                            <option value="new">New</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="archived">Archived</option>
                        </select>
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={selectStyle}>
                            <option value="">All Categories</option>
                            {Object.keys(CATEGORY_MAP).map(k => <option key={k} value={k}>{CATEGORY_MAP[k].label}</option>)}
                        </select>
                        <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} style={selectStyle}>
                            <option value="">All Ratings</option>
                            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                        </select>

                        {hasFilters && (
                            <button onClick={clearFilters} style={clearBtnStyle}>
                                <X size={14} strokeWidth={2.5} /> Clear
                            </button>
                        )}
                        <button onClick={() => setShowSettings(!showSettings)} style={{ ...clearBtnStyle, color: "#64748b" }}>
                            <Settings size={14} strokeWidth={2.5} style={{ color: "#64748b" }} /> Settings
                        </button>
                    </div>
                </div>

                {/* ── Settings Panel ── */}
                {showSettings && (
                    <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div>
                            <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px", display: "block" }}>Logout Feedback Interval</label>
                            <input type="number" min="0" value={intervalValue} onChange={e => setIntervalValue(e.target.value)} style={{ ...searchInputStyle, width: "120px" }} />
                        </div>
                        <div style={{ paddingBottom: "2px" }}>
                            <button onClick={handleSaveSettings} disabled={savingSettings} style={{ background: "#6366f1", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "600", cursor: savingSettings ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                                {savingSettings ? "Saving..." : "Save"}
                            </button>
                        </div>
                        <div style={{ paddingBottom: "10px", fontSize: "12px", color: "#94a3b8", flex: 1, minWidth: "250px" }}>
                            Set the number of manual logouts required after the 1st before showing the feedback modal again (e.g., 10 means 10th, 20th... checkout).
                        </div>
                    </div>
                )}

                {/* ── Table ── */}
                <div>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                <th style={thStyle}>USER / TENANT</th>
                                <th style={thStyle}>CATEGORY</th>
                                <th style={thStyle}>RATING</th>
                                <th style={thStyle}>COMMENT</th>
                                <th style={thStyle}>SUBMITTED</th>
                                <th style={thStyle}>STATUS</th>
                                <th style={{ ...thStyle, width: "60px", textAlign: "center" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFeedbacks.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                                        No feedback found. {hasFilters && "Try clearing your filters."}
                                    </td>
                                </tr>
                            ) : (
                                filteredFeedbacks.map((fb) => {
                                    const cat = CATEGORY_MAP[fb.category] || CATEGORY_MAP["Other"];
                                    const CatIcon = cat.icon;
                                    const stat = STATUS_MAP[fb.status] || STATUS_MAP.new;

                                    return (
                                        <tr
                                            key={fb._id}
                                            onClick={() => setSelectedFeedback(fb)}
                                            style={trStyle}
                                        >
                                            {/* User Column */}
                                            <td style={tdStyle}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <Avatar
                                                        src={fb.user_id?.profile_avatar?.secure_url}
                                                        name={fb.user_id?.name}
                                                        size={40}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>
                                                            {fb.user_id?.name || "Unknown User"}
                                                        </div>
                                                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                                                            {fb.user_id?.email || "No email"}
                                                        </div>
                                                        <div style={{ fontSize: "11px", color: "#94a3b8", display: "inline-flex", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px", marginTop: "4px" }}>
                                                            {fb.tenant_id?.name || "No Tenant"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td style={tdStyle}>
                                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30`, padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>
                                                    <CatIcon size={14} strokeWidth={2.5} />
                                                    {cat.label}
                                                </div>
                                            </td>

                                            {/* Rating */}
                                            <td style={tdStyle}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                    <StarDisplay rating={fb.rating} size={15} />
                                                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>
                                                        {fb.rating}.0 <span style={{ fontWeight: "400", color: "#94a3b8" }}>/ 5</span>
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Comment */}
                                            <td style={{ ...tdStyle, maxWidth: "240px" }}>
                                                {fb.comment ? (
                                                    <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                        {fb.comment}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "#cbd5e1", fontSize: "13px", fontStyle: "italic" }}>No comment provided</span>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td style={tdStyle}>
                                                <div style={{ fontSize: "13px", color: "#334155", fontWeight: "500" }}>
                                                    {formatTimeAgo(fb.createdAt)}
                                                </div>
                                                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                                                    {new Date(fb.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td style={tdStyle}>
                                                <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", background: stat.bg, color: stat.color, borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                                                    {stat.label}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td style={{ ...tdStyle, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                                                <div style={{ position: "relative", display: "inline-block" }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(openMenuId === fb._id ? null : fb._id);
                                                        }}
                                                        style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "6px", color: "#64748b" }}
                                                        className="hover-bg-slate-100"
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>

                                                    {openMenuId === fb._id && (
                                                        <div style={{ position: "absolute", right: 0, top: "100%", marginTop: "4px", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)", zIndex: 10, width: "160px", padding: "4px" }}>
                                                            <MenuButton onClick={() => handleStatusChange(fb._id, "new")} icon={AlertCircle} label="Mark as New" disabled={fb.status === "new"} />
                                                            <MenuButton onClick={() => handleStatusChange(fb._id, "reviewed")} icon={CheckCircle2} label="Mark as Reviewed" disabled={fb.status === "reviewed"} />
                                                            <MenuButton onClick={() => handleStatusChange(fb._id, "archived")} icon={Trash2} label="Archive" disabled={fb.status === "archived"} color="#ef4444" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Detail Drawer ── */}
            {selectedFeedback && (
                <DetailDrawer
                    fb={selectedFeedback}
                    onClose={() => setSelectedFeedback(null)}
                    onStatusChange={handleStatusChange}
                    updating={updatingId === selectedFeedback._id}
                />
            )}
        </div>
    );
};

/* ── Components & Styles ── */

const MenuButton = ({ icon: Icon, label, onClick, disabled, color = "#475569" }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        disabled={disabled}
        style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px", background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "500", color: disabled ? "#cbd5e1" : color, textAlign: "left", borderRadius: "4px" }}
        className={disabled ? "" : "hover-bg-slate-50"}
    >
        <Icon size={14} />
        {label}
    </button>
);

const StatCard = ({ icon: Icon, label, value, suffix, color, bg }) => (
    <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", gap: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
            <Icon size={24} strokeWidth={2} />
        </div>
        <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", lineHeight: "1" }}>{value}</span>
                {suffix && <span style={{ fontSize: "14px", fontWeight: "600", color: "#94a3b8" }}>{suffix}</span>}
            </div>
        </div>
    </div>
);

const DetailDrawer = ({ fb, onClose, onStatusChange, updating }) => {
    const cat = CATEGORY_MAP[fb.category] || CATEGORY_MAP["Other"];
    const stat = STATUS_MAP[fb.status] || STATUS_MAP.new;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(2px)" }} onClick={onClose} />
            <div style={{ position: "relative", width: "450px", maxWidth: "100%", background: "white", height: "100%", boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", transform: "translateX(0)", transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>

                {/* Header */}
                <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Feedback Details</h2>
                        <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                            <Clock size={12} /> Submitted {new Date(fb.createdAt).toLocaleString()}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px", cursor: "pointer", color: "#64748b" }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* User Section */}
                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                        <Avatar src={fb.user_id?.profile_avatar?.secure_url} name={fb.user_id?.name} size={48} />
                        <div>
                            <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "15px" }}>{fb.user_id?.name || "Unknown"}</div>
                            <div style={{ color: "#64748b", fontSize: "13px", marginTop: "2px" }}>{fb.user_id?.email}</div>
                            <div style={{ marginTop: "8px", display: "inline-block", background: "white", padding: "4px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "500", color: "#475569" }}>
                                Tenant: {fb.tenant_id?.name || "None"}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        {/* Category */}
                        <div>
                            <div style={labelStyle}>Category</div>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30`, padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}>
                                <cat.icon size={16} strokeWidth={2.5} />
                                {cat.label}
                            </div>
                        </div>

                        {/* Rating */}
                        <div>
                            <div style={labelStyle}>Rating</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <StarDisplay rating={fb.rating} size={20} />
                                <span style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{fb.rating}.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <div style={labelStyle}>Comment</div>
                        <div style={{ background: "white", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "12px", fontSize: "14px", color: "#1e293b", lineHeight: "1.6", whiteSpace: "pre-wrap", minHeight: "100px" }}>
                            {fb.comment || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No comment provided.</span>}
                        </div>
                    </div>

                    {/* Status Controls */}
                    <div>
                        <div style={labelStyle}>Current Status</div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button onClick={() => onStatusChange(fb._id, "new")} disabled={updating} style={drawerBtnStyle(fb.status === "new", "#2563eb", "#dbeafe")}>
                                New
                            </button>
                            <button onClick={() => onStatusChange(fb._id, "reviewed")} disabled={updating} style={drawerBtnStyle(fb.status === "reviewed", "#059669", "#d1fae5")}>
                                Reviewed
                            </button>
                            <button onClick={() => onStatusChange(fb._id, "archived")} disabled={updating} style={drawerBtnStyle(fb.status === "archived", "#64748b", "#f1f5f9")}>
                                Archived
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            <style>{`.hover-bg-slate-50:hover { background: #f8fafc !important; } .hover-bg-slate-100:hover { background: #f1f5f9 !important; }`}</style>
        </div>
    );
};

const drawerBtnStyle = (active, color, bg) => ({
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: active ? `2px solid ${color}` : "1px solid #e2e8f0",
    background: active ? bg : "white",
    color: active ? color : "#64748b",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s",
});

const labelStyle = { fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" };

const searchInputStyle = { width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", color: "#0f172a", outline: "none" };
const selectStyle = { padding: "8px 30px 8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", color: "#0f172a", background: "white", outline: "none", cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "14px" };
const clearBtnStyle = { display: "inline-flex", alignItems: "center", gap: "4px", padding: "8px 12px", background: "none", border: "none", color: "#6366f1", fontSize: "13px", fontWeight: "600", cursor: "pointer" };
const thStyle = { padding: "16px 20px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" };
const tdStyle = { padding: "16px 20px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" };
const trStyle = { cursor: "pointer", transition: "background 0.15s" };

export default FeedbackList;
