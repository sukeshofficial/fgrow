// client/src/components/blog/BlogCard/BlogCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Eye, ThumbsUp, MessageCircle, Star, Check } from "lucide-react";
import BlogAvatar from "../BlogAvatar/BlogAvatar";
import "./BlogCard.css";

const BlogCard = ({ post }) => {
    const formatDate = (d) => {
        if (!d) return "Recently";
        return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <Link to={`/blog/${post.slug}`} className="bc-card">
            <div className="bc-image-wrap">
                <img
                    src={post.coverImage || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800"}
                    alt={post.title}
                    loading="lazy"
                />
                <div className="bc-image-gradient" />
                <div className="bc-badge-wrap">
                    {post.category && <span className="bc-category-badge">{post.category}</span>}
                    {post.authorType === "admin" && <span className="bc-official-badge">Official</span>}
                    {post.isFeatured && (
                        <span className="bc-official-badge bc-featured-badge">★ Featured</span>
                    )}
                    {post.userHasViewed && (
                        <span className="bc-viewed-badge">
                            <Check size={12} /> Viewed
                        </span>
                    )}
                </div>
            </div>

            <div className="bc-body">
                <div className="bc-meta">
                    <span><Calendar size={12} /> {formatDate(post.publishedAt || post.createdAt)}</span>
                    <span><Clock size={12} /> {post.readingTime || 5} min</span>
                </div>

                <h3 className="bc-title">{post.title}</h3>
                <p className="bc-summary">{post.summary}</p>

                <div className="bc-footer">
                    <div className="bc-author-info">
                        <BlogAvatar
                            user={post.authorId || { name: "FGrow" }}
                            size="30px"
                            className="bc-avatar-fix"
                        />
                        <span className="bc-author-name">{post.authorId?.name || "FGrow"}</span>
                    </div>
                    <div className="bc-stats">
                        <span><Eye size={13} /> {post.stats?.views || 0}</span>
                        <span><ThumbsUp size={13} /> {post.stats?.likes || 0}</span>
                        <span><MessageCircle size={13} /> {post.stats?.comments || 0}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default BlogCard;
