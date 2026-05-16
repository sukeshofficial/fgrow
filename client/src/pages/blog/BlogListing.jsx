// client/src/pages/blog/BlogListing.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, ArrowUpRight, Clock, TrendingUp, Zap,
    BookOpen, Users, Star, RefreshCw
} from "lucide-react";
import { api } from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import BlogCard from "../../components/blog/BlogCard/BlogCard";
import BlogAvatar from "../../components/blog/BlogAvatar/BlogAvatar";
import Metadata from "../../components/blog/Metadata/Metadata";
import "./BlogListing.css";

const CATEGORIES = ["All", "Product", "Engineering", "Marketing", "Announcements", "Design", "Community"];

const SkeletonCard = () => (
    <div className="blog-glass-card" style={{ overflow: "hidden" }}>
        <div className="blog-skeleton" style={{ height: 220 }} />
        <div style={{ padding: 24 }}>
            <div className="blog-skeleton" style={{ height: 14, width: "40%", marginBottom: 12 }} />
            <div className="blog-skeleton" style={{ height: 22, width: "90%", marginBottom: 8 }} />
            <div className="blog-skeleton" style={{ height: 22, width: "70%", marginBottom: 16 }} />
            <div className="blog-skeleton" style={{ height: 14, width: "60%", marginBottom: 8 }} />
            <div className="blog-skeleton" style={{ height: 14, width: "80%", marginBottom: 24 }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="blog-skeleton" style={{ height: 32, width: 100, borderRadius: 999 }} />
                <div className="blog-skeleton" style={{ height: 32, width: 80, borderRadius: 999 }} />
            </div>
        </div>
    </div>
);

const BlogListing = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [activeTag, setActiveTag] = useState(null);
    const [sort, setSort] = useState("latest");
    const [authorType, setAuthorType] = useState("all");
    const [allTags, setAllTags] = useState([]);
    const [featuredPost, setFeaturedPost] = useState(null);

    const fetchBlogs = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            if (params.q) qs.set("q", params.q);
            if (params.category && params.category !== "All") qs.set("category", params.category);
            if (params.tag) qs.set("tags", params.tag);
            if (params.sort && params.sort !== "latest") qs.set("sort", params.sort);
            if (params.authorType && params.authorType !== "all") qs.set("authorType", params.authorType);
            qs.set("limit", "30");

            const res = await api.get(`/blogs?${qs.toString()}`);
            if (res.data.success) {
                const data = res.data.data;
                setBlogs(data);
                // Collect all unique tags
                const tags = [...new Set(data.flatMap((p) => p.tags || []))];
                setAllTags(tags.slice(0, 20));
            }
        } catch (err) {
            console.error("Fetch blogs error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchFeatured = useCallback(async () => {
        try {
            const res = await api.get("/blogs?featured=true&limit=1");
            if (res.data.success && res.data.data.length > 0) {
                setFeaturedPost(res.data.data[0]);
            }
        } catch (_) { }
    }, []);

    useEffect(() => {
        fetchBlogs({ sort, authorType });
        fetchFeatured();
    }, []);

    const applyFilters = (overrides = {}) => {
        const params = {
            q: searchQuery,
            category: activeCategory,
            tag: activeTag,
            sort,
            authorType,
            ...overrides,
        };
        fetchBlogs(params);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters({ q: searchQuery });
    };

    const handleCategory = (cat) => {
        setActiveCategory(cat);
        applyFilters({ category: cat });
    };

    const handleTag = (tag) => {
        const next = activeTag === tag ? null : tag;
        setActiveTag(next);
        applyFilters({ tag: next });
    };

    const handleSort = (s) => {
        setSort(s);
        applyFilters({ sort: s });
    };

    const handleAuthorType = (t) => {
        setAuthorType(t);
        applyFilters({ authorType: t });
    };

    const clearFilters = () => {
        setSearchQuery("");
        setActiveCategory("All");
        setActiveTag(null);
        setSort("latest");
        setAuthorType("all");
        fetchBlogs({ sort: "latest", authorType: "all" });
    };

    const isFiltered = searchQuery || activeCategory !== "All" || activeTag || sort !== "latest" || authorType !== "all";

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

    return (
        <div className="bl-page">
            <Metadata
                title="Insights Hub"
                description="Strategic perspectives, engineering deep-dives, and growth strategies from the FGrow consultancy team."
                keywords="consultancy, growth, fgrow journal, enterprise strategy, software engineering"
            />
            {/* Nav */}
            <nav className="bl-nav">
                <div className="bl-nav-inner">
                    <Link to="/" className="bl-logo">
                        <img src="/logo.png" alt="FGrow" className="bl-logo-img" />
                        FGrow
                    </Link>
                    <div className="bl-nav-links">
                        <Link to="/blog" className="bl-nav-link active">Insights</Link>
                        <a href="#community" className="bl-nav-link">Community</a>

                        {user ? (
                            <div className="bl-user-nav" onClick={() => navigate("/dashboard")}>
                                <BlogAvatar user={user} size="32px" />
                                <span className="bl-user-name">{user.name?.split(' ')[0]}</span>
                            </div>
                        ) : (
                            <button
                                className="blog-btn blog-btn-primary blog-btn-sm blog-btn-pill"
                                onClick={() => navigate("/login")}
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <header className="bl-hero">
                <div className="bl-hero-eyebrow">
                    <BookOpen size={13} /> Insights Hub
                </div>
                <h1>
                    Insights for the<br />
                    <span>Modern Enterprise</span>
                </h1>
                <p className="bl-hero-sub">
                    Product updates, engineering deep-dives, and growth strategies from the FGrow team.
                </p>

                <div className="bl-search-wrap">
                    <form onSubmit={handleSearch}>
                        <Search className="bl-search-icon" size={20} />
                        <input
                            type="text"
                            className="bl-search-input"
                            placeholder="Search articles, topics, tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="bl-search-btn">Search</button>
                    </form>
                </div>
            </header>

            {/* Filters */}
            <div className="bl-filters">
                <div className="bl-filters-inner">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            className={`bl-filter-pill${activeCategory === cat ? " active" : ""}`}
                            onClick={() => handleCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}

                    <div className="bl-filter-sep" />

                    <div className="bl-author-filter">
                        {[["all", "All"], ["admin", "Official"], ["user", "Community"]].map(([val, label]) => (
                            <button
                                key={val}
                                className={`bl-author-btn${authorType === val ? " active" : ""}`}
                                onClick={() => handleAuthorType(val)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="bl-sort-toggle">
                        <button
                            className={`bl-sort-btn${sort === "latest" ? " active" : ""}`}
                            onClick={() => handleSort("latest")}
                        >
                            <Clock size={13} /> Latest
                        </button>
                        <button
                            className={`bl-sort-btn${sort === "trending" ? " active" : ""}`}
                            onClick={() => handleSort("trending")}
                        >
                            <TrendingUp size={13} /> Trending
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main className="bl-content">

                {/* Tag cloud */}
                {allTags.length > 0 && !loading && (
                    <div className="bl-tags">
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                className={`bl-tag${activeTag === tag ? " active" : ""}`}
                                onClick={() => handleTag(tag)}
                            >
                                #{tag}
                            </button>
                        ))}
                        {isFiltered && (
                            <button className="bl-tag" onClick={clearFilters} style={{ color: "var(--blog-accent)" }}>
                                <RefreshCw size={11} style={{ display: "inline", marginRight: 4 }} />
                                Clear filters
                            </button>
                        )}
                    </div>
                )}

                {/* Featured post */}
                {featuredPost && !isFiltered && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="bl-section-header" style={{ marginBottom: 20 }}>
                            <Star size={18} color="var(--blog-accent)" />
                            <span className="bl-section-title">Featured Story</span>
                            <div className="bl-section-line" />
                        </div>
                        <div className="bl-featured" onClick={() => navigate(`/blog/${featuredPost.slug}`)}>
                            <div
                                className="bl-featured-image"
                                style={{
                                    background: featuredPost.coverImage
                                        ? `url(${featuredPost.coverImage}) center/cover no-repeat`
                                        : "linear-gradient(135deg, #e0e7ff, #ede9fe)",
                                }}
                            >
                                <div className="bl-featured-image-overlay" />
                            </div>
                            <div className="bl-featured-body">
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                    <span className="blog-badge blog-badge-primary">Featured</span>
                                    {featuredPost.category && (
                                        <span className="blog-badge blog-badge-secondary">{featuredPost.category}</span>
                                    )}
                                </div>
                                <div className="bl-featured-meta">
                                    <Clock size={13} /> {featuredPost.readingTime || 5} min read
                                    <span>·</span>
                                    {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                                </div>
                                <h2 className="bl-featured-title">{featuredPost.title}</h2>
                                <p className="bl-featured-summary blog-truncate-3">{featuredPost.summary}</p>

                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div
                                        className="blog-avatar"
                                        style={{ width: 36, height: 36, fontSize: "0.85rem" }}
                                    >
                                        {featuredPost.authorId?.avatar
                                            ? <img src={featuredPost.authorId.avatar} alt="" />
                                            : (featuredPost.authorId?.name?.charAt(0) || "F")}
                                    </div>
                                    <span style={{ fontWeight: 600, color: "var(--blog-text-secondary)", fontSize: "0.9rem" }}>
                                        {featuredPost.authorId?.name || "FGrow Team"}
                                    </span>
                                </div>

                                <div className="bl-featured-cta">
                                    Read full article <ArrowUpRight size={18} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Blog Grid */}
                {!isFiltered && blogs.length > 0 && (
                    <div className="bl-section-header" style={{ marginTop: 48, marginBottom: 20 }}>
                        <Zap size={18} color="var(--blog-accent)" />
                        <span className="bl-section-title">
                            {sort === "trending" ? "Trending Articles" : "Latest Articles"}
                        </span>
                        <div className="bl-section-line" />
                    </div>
                )}

                <div className="bl-grid">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)
                    ) : blogs.length === 0 ? (
                        <div className="bl-empty">
                            <div className="bl-empty-icon">
                                <BookOpen size={48} />
                            </div>
                            <h3>No insights found</h3>
                            <p>We couldn't find any articles matching your current filters. Try broadening your perspective or exploring another category.</p>
                            <button className="blog-btn blog-btn-primary" onClick={clearFilters}>
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {blogs.map((post, i) => (
                                <motion.div
                                    key={post._id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                >
                                    <BlogCard post={post} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BlogListing;
