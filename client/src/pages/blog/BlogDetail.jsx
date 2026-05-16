// client/src/pages/blog/BlogDetail.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Calendar, Eye, ThumbsUp, Clock,
    Share2, Bookmark, MessageCircle, Loader2, Check,
    Link as LinkIcon
} from "lucide-react";
import { FaLinkedin, FaTwitter } from "react-icons/fa";
import { api } from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import BlogAvatar from "../../components/blog/BlogAvatar/BlogAvatar";
import TableOfContents from "../../components/blog/TableOfContents/TableOfContents";
import MarkdownRenderer from "../../components/blog/ReaderContent/MarkdownRenderer";
import CommentSection from "../../components/blog/CommentSection/CommentSection";
import ReactionBar from "../../components/blog/ReactionBar/ReactionBar";
import Metadata from "../../components/blog/Metadata/Metadata";
import { List, MessageSquare } from "lucide-react";
import { debounce } from "../../utils/debounce";
import "./BlogDetail.css";

const BlogDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [showResume, setShowResume] = useState(false);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchPost();
    }, [slug]);

    useEffect(() => {
        if (post && post.readingProgress > 5 && post.readingProgress < 95) {
            setShowResume(true);
        }
    }, [post]);

    useEffect(() => {
        const handleScroll = () => {
            if (!post || !user) return;
            const winScroll = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = Math.round((winScroll / height) * 100);

            if (scrolled > progress) {
                setProgress(scrolled);
                debouncedSync(scrolled);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [post, progress, user]);

    const debouncedSync = useCallback(
        debounce((p) => {
            if (post) {
                api.patch(`/blogs/${post._id}/progress`, { progress: p }).catch(() => { });
            }
        }, 2000),
        [post]
    );

    const resumeReading = () => {
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollTo = (post.readingProgress / 100) * height;
        window.scrollTo({ top: scrollTo, behavior: "smooth" });
        setShowResume(false);
    };

    const [copied, setCopied] = useState(false);

    const fetchPost = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get(`/blogs/${slug}`);
            if (res.data.success) {
                setPost(res.data.data);
                setRelated(res.data.related || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Insights not found");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return "";
        return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    };

    const shareOnPlatform = (platform) => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`Check out this article on FGrow: ${post.title}`);

        let shareUrl = "";
        if (platform === "linkedin") {
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        } else if (platform === "twitter") {
            shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        }

        if (shareUrl) {
            window.open(shareUrl, "_blank", "width=600,height=400");
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="bd-page bd-loading">
                <Loader2 size={44} className="blog-spin" style={{ color: "var(--blog-indigo-500)" }} />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="bd-page bd-error">
                <h2>404</h2>
                <p>{error || "The article you're looking for has vanished into the void."}</p>
                <button className="blog-btn blog-btn-primary" onClick={() => navigate("/blog")}>
                    Return to Insights
                </button>
            </div>
        );
    }

    return (
        <motion.div className="bd-page bd-light" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Metadata
                title={post.title}
                description={post.summary}
                keywords={post.tags?.join(", ")}
                ogImage={post.coverImage}
            />
            {/* Progress bar */}
            <motion.div className="bd-progress" style={{ scaleX }} />

            {/* Nav */}
            <nav className="bd-nav">
                <div className="bd-nav-inner">
                    <Link to="/blog" className="bd-nav-logo">
                        <img src="/logo.png" alt="FGrow" style={{ height: "28px" }} />
                        FGrow
                    </Link>
                    <div className="bd-nav-actions">
                        <Link to="/blog" className="bd-nav-back">
                            <ArrowLeft size={16} /> All Insights
                        </Link>
                        {user ? (
                            <div className="bd-user-nav" onClick={() => navigate("/dashboard")}>
                                <BlogAvatar user={user} size="28px" />
                                <span className="bd-user-name">{user.name?.split(' ')[0]}</span>
                            </div>
                        ) : (
                            <button className="blog-btn blog-btn-primary blog-btn-sm blog-btn-pill" onClick={() => navigate("/login")}>
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero image */}
            {post.coverImage ? (
                <motion.div className="bd-hero" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
                    <img src={post.coverImage} alt={post.title} />
                    <div className="bd-hero-overlay" />
                </motion.div>
            ) : (
                <div className="bd-no-hero" />
            )}

            {/* Layout */}
            <div className="bd-layout">
                {/* Left: ToC */}
                <aside className="bd-toc-col">
                    <TableOfContents content={post.content} />
                </aside>

                {/* Center: Article */}
                <article className="bd-article-col">
                    <header className="bd-header">
                        <Link to="/blog" className="bd-back-link">
                            <ArrowLeft size={15} /> Back to Insights
                        </Link>

                        <div className="bd-meta-top">
                            {post.category && <div className="bd-category">{post.category}</div>}
                            {post.userHasViewed && (
                                <div className="bd-viewed-info">
                                    <Check size={14} /> You have read this
                                </div>
                            )}
                        </div>

                        <h1 className="bd-title">{post.title}</h1>

                        {/* Meta strip */}
                        <div className="bd-author-row">
                            <div className="bd-author-info">
                                <BlogAvatar user={post.authorId || { name: "FGrow Team" }} size="44px" />
                                <div>
                                    <div className="bd-author-name">{post.authorId?.name || "FGrow Team"}</div>
                                    <div className="bd-author-sub">
                                        <span><Calendar size={13} /> {formatDate(post.publishedAt || post.createdAt)}</span>
                                        <span>·</span>
                                        <span><Clock size={13} /> {post.readingTime || 5} min read</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bd-article-actions">
                                <button className="bd-action-btn" onClick={() => shareOnPlatform('linkedin')} title="Share on LinkedIn">
                                    <FaLinkedin size={18} />
                                </button>
                                <button className="bd-action-btn" onClick={() => shareOnPlatform('twitter')} title="Share on X">
                                    <FaTwitter size={18} />
                                </button>
                                <button className={`bd-action-btn ${copied ? 'copied' : ''}`} onClick={copyLink} title="Copy Link">
                                    {copied ? <Check size={18} /> : <LinkIcon size={18} />}
                                </button>
                                <div className="bd-action-sep" />
                                <button className="bd-action-btn" title="Bookmark">
                                    <Bookmark size={18} />
                                </button>
                            </div>
                        </div>

                        {post.summary && <p className="bd-summary">{post.summary}</p>}

                        {/* Reactions under header */}
                        <ReactionBar
                            key={post._id}
                            targetId={post._id}
                            targetType="BlogPost"
                            initialLikes={post.stats?.likes || 0}
                            initialUserReaction={post.userReaction || null}
                            onReactionChange={(reaction, likes) => {
                                setPost(prev => ({
                                    ...prev,
                                    userReaction: reaction,
                                    stats: { ...prev.stats, likes }
                                }));
                            }}
                        />

                        <div style={{ marginTop: "2rem" }}>
                            <MarkdownRenderer content={post.content} />
                        </div>
                    </header>

                    {/* Footer */}
                    <footer className="bd-footer">
                        <div className="bd-stats-row">
                            <span className="bd-stat"><Eye size={16} /> {post.stats?.views || 0} views</span>
                            <span className="bd-stat"><ThumbsUp size={16} /> {post.stats?.likes || 0} likes</span>
                            <span className="bd-stat"><MessageCircle size={16} /> {post.stats?.comments || 0} comments</span>
                        </div>

                        {post.tags?.length > 0 && (
                            <div className="bd-tags">
                                {post.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="bd-tag"
                                        onClick={() => navigate(`/blog?tags=${tag}`)}
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="bd-cta">
                            <h4>Enjoyed this read?</h4>
                            <p>Join our community of 10,000+ readers and never miss an update.</p>
                            <button className="blog-btn blog-btn-primary blog-btn-lg blog-btn-pill">
                                Subscribe to Newsletter
                            </button>
                        </div>
                    </footer>

                    {/* Comments */}
                    <CommentSection blogPostId={post._id} />
                </article>

                {/* Right sidebar */}
                <aside className="bd-sidebar-col">
                    {related.length > 0 && (
                        <div className="bd-sidebar-card">
                            <div className="bd-sidebar-title">Related Articles</div>
                            {related.map((r) => (
                                <Link key={r._id} to={`/blog/${r.slug}`} className="bd-related-item">
                                    {r.coverImage && (
                                        <img src={r.coverImage} alt={r.title} className="bd-related-img" />
                                    )}
                                    <div className="bd-related-title">{r.title}</div>
                                    <div className="bd-related-meta">
                                        <span><Clock size={11} /> {r.readingTime || 5} min</span>
                                        <span><ThumbsUp size={11} /> {r.stats?.likes || 0}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="bd-sidebar-card">
                        <div className="bd-sidebar-title">Article Stats</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[
                                { icon: <Eye size={14} />, label: "Views", val: post.stats?.views || 0 },
                                { icon: <ThumbsUp size={14} />, label: "Likes", val: post.stats?.likes || 0 },
                                { icon: <MessageCircle size={14} />, label: "Comments", val: post.stats?.comments || 0 },
                            ].map(({ icon, label, val }) => (
                                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--blog-slate-600)", fontWeight: 600 }}>
                                        {icon} {label}
                                    </span>
                                    <span style={{ fontWeight: 800, color: "var(--blog-slate-900)" }}>{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Mobile Quick Nav */}
            <div className="bd-mobile-nav">
                <button className="bd-mobile-btn" onClick={() => {
                    const el = document.querySelector('.bd-toc-col');
                    el.classList.toggle('active');
                }}>
                    <List size={20} />
                    <span>TOC</span>
                </button>
                <button className="bd-mobile-btn" onClick={() => {
                    const el = document.querySelector('.cs-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                }}>
                    <MessageSquare size={20} />
                    <span>Comments</span>
                </button>
            </div>

            {/* Resume prompt */}
            <AnimatePresence>
                {showResume && (
                    <motion.div
                        className="bd-resume-prompt"
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="bd-resume-content">
                            <div className="bd-resume-info">
                                <Clock size={16} />
                                <span>You left off at <strong>{post.readingProgress}%</strong></span>
                            </div>
                            <div className="bd-resume-actions">
                                <button className="blog-btn blog-btn-primary blog-btn-sm" onClick={resumeReading}>
                                    Resume Reading
                                </button>
                                <button className="bd-resume-close" onClick={() => setShowResume(false)}>
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default BlogDetail;
