// client/src/components/blog/CommentSection/CommentSection.jsx
import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Reply, Edit2, Trash2, Loader2, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/api";
import { useAuth } from "../../../hooks/useAuth";
import BlogAvatar from "../BlogAvatar/BlogAvatar";
import MentionInput from "../MentionInput/MentionInput";
import ReactionBar from "../ReactionBar/ReactionBar";
import "./CommentSection.css";

const CommentItem = ({ comment, onReply, onEdit, onDelete, depth = 0 }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(comment.content);
    const [editMentions, setEditMentions] = useState(comment.mentions?.map(m => m._id) || []);
    const [showReplyEditor, setShowReplyEditor] = useState(false);
    const [replyValue, setReplyValue] = useState("");
    const [replyMentions, setReplyMentions] = useState([]);
    const [showReplies, setShowReplies] = useState(false);

    const handleEdit = async () => {
        if (!editValue.trim()) return;
        await onEdit(comment._id, editValue, [...new Set(editMentions)]);
        setIsEditing(false);
    };

    const handleReply = async () => {
        if (!replyValue.trim()) return;
        await onReply(comment._id, replyValue, [...new Set(replyMentions)]);
        setReplyValue("");
        setReplyMentions([]);
        setShowReplyEditor(false);
    };

    const formatContent = (commentObj) => {
        const content = commentObj.content;
        if (!content) return "";

        if (!commentObj.mentions || commentObj.mentions.length === 0) {
            return content.split(/(\s+)/).map((part, i) => {
                if (part.startsWith("@") && part.length > 1) {
                    const name = part.substring(1);
                    return (
                        <span key={i} className="cs-mention">
                            <span className="cs-mention-initial">{name.charAt(0).toUpperCase()}</span>
                            <span>{part}</span>
                        </span>
                    );
                }
                return part;
            });
        }

        let chunks = [content];
        const sortedMentions = [...commentObj.mentions].sort((a, b) => (b?.name?.length || 0) - (a?.name?.length || 0));

        sortedMentions.forEach(u => {
            if (!u || !u.name) return;
            const searchStr = `@${u.name}`;

            chunks = chunks.flatMap(chunk => {
                if (typeof chunk !== "string") return chunk;

                const parts = chunk.split(searchStr);
                return parts.flatMap((part, j, arr) => {
                    if (j === arr.length - 1) return [part];

                    const avatarUrl = typeof u.avatar === 'string' ? u.avatar : u.profile_avatar?.secure_url;
                    return [
                        part,
                        <span key={`${u._id}-${j}-${Math.random()}`} className="cs-mention">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="" className="cs-mention-img" />
                            ) : (
                                <span className="cs-mention-initial">{u.name.charAt(0).toUpperCase()}</span>
                            )}
                            <span>{searchStr}</span>
                        </span>
                    ];
                });
            });
        });

        return chunks;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="cs-comment-wrap">
            <div className="cs-yt-comment">
                <div className="cs-avatar-col">
                    <BlogAvatar user={comment.authorId} size="40px" className="cs-avatar-hover" />
                </div>

                <div className="cs-content-col">
                    <div className="cs-header">
                        <span className="cs-username">@{comment.authorId?.name || "Guest"}</span>
                        <span className="cs-time">{formatDate(comment.createdAt)}</span>
                        {comment.isEdited && <span className="cs-edited">(edited)</span>}
                    </div>

                    {isEditing ? (
                        <div className="cs-edit-mode">
                            <MentionInput
                                value={editValue}
                                onChange={setEditValue}
                                onMention={(uId) => setEditMentions(prev => [...prev, uId])}
                            />
                            <div className="cs-editor-actions">
                                <button className="blog-btn blog-btn-ghost blog-btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button className="blog-btn blog-btn-primary blog-btn-sm" onClick={handleEdit}>Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className={`cs-body${comment.isDeleted ? " cs-body-deleted" : ""}`}>
                            {comment.isDeleted ? "This comment has been deleted" : formatContent(comment)}
                        </div>
                    )}

                    {!comment.isDeleted && (
                        <div className="cs-actions">
                            <div className="cs-action-group">
                                <ReactionBar
                                    key={comment._id}
                                    targetId={comment._id}
                                    targetType="Comment"
                                    initialLikes={comment.stats?.likes || 0}
                                    initialUserReaction={
                                        comment.userHasLiked ? "like" : comment.userHasDisliked ? "dislike" : null
                                    }
                                    size="sm"
                                />
                                {user && depth < 2 && (
                                    <button className="cs-action-btn" onClick={() => setShowReplyEditor(!showReplyEditor)}>
                                        Reply
                                    </button>
                                )}
                            </div>

                            {comment.isOwner && !isEditing && (
                                <div className="cs-action-group">
                                    <button className="cs-action-btn" onClick={() => setIsEditing(true)}>
                                        Edit
                                    </button>
                                    <button className="cs-action-btn cs-action-btn-danger" onClick={() => onDelete(comment._id)}>
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {showReplyEditor && (
                        <div className="cs-reply-editor">
                            <MentionInput
                                value={replyValue}
                                onChange={setReplyValue}
                                placeholder={`Replying to @${comment.authorId?.name}...`}
                                onMention={(uId) => setReplyMentions(prev => [...prev, uId])}
                            />
                            <div className="cs-editor-actions">
                                <button className="blog-btn blog-btn-ghost blog-btn-sm" onClick={() => setShowReplyEditor(false)}>Cancel</button>
                                <button className="blog-btn blog-btn-primary blog-btn-sm" onClick={handleReply} disabled={!replyValue.trim()}>
                                    Reply
                                </button>
                            </div>
                        </div>
                    )}

                    {comment.replies?.length > 0 && (
                        <div className="cs-replies-container">
                            <button
                                className="cs-toggle-replies"
                                onClick={() => setShowReplies(!showReplies)}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`y-chevron ${showReplies ? 'open' : ''}`}>
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                                {comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}
                            </button>

                            {showReplies && (
                                <div className="cs-replies">
                                    {comment.replies.map((reply) => (
                                        <CommentItem
                                            key={reply._id}
                                            comment={reply}
                                            onReply={onReply}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            depth={depth + 1}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CommentSection = ({ blogPostId }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [newValue, setNewValue] = useState("");
    const [newMentions, setNewMentions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sort, setSort] = useState("newest");

    const fetchComments = useCallback(async () => {
        try {
            const res = await api.get(`/blog-social/${blogPostId}/comments?sort=${sort}`);
            if (res.data.success) {
                setComments(res.data.data);
            }
        } catch (err) {
            console.error("Fetch comments error:", err);
        } finally {
            setLoading(false);
        }
    }, [blogPostId, sort]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handlePost = async () => {
        if (!newValue.trim()) return;
        setSubmitting(true);
        try {
            const payload = { content: newValue, mentions: [...new Set(newMentions)] };
            const res = await api.post(`/blog-social/${blogPostId}/comments`, payload);
            if (res.data.success) {
                setNewValue("");
                setNewMentions([]);
                fetchComments(); // Refresh for accurate threading
            }
        } catch (err) {
            console.error("Post comment error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (parentId, content, mentions) => {
        try {
            const res = await api.post(`/blog-social/${blogPostId}/comments`, { content, parentId, mentions });
            if (res.data.success) {
                fetchComments();
            }
        } catch (err) {
            console.error("Reply error:", err);
        }
    };

    const handleEdit = async (commentId, content, mentions) => {
        try {
            const res = await api.patch(`/blog-social/comments/${commentId}`, { content, mentions });
            if (res.data.success) {
                fetchComments();
            }
        } catch (err) {
            console.error("Edit error:", err);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            const res = await api.delete(`/blog-social/comments/${commentId}`);
            if (res.data.success) {
                fetchComments();
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    return (
        <section className="cs-section">
            <div className="cs-header-row">
                <div className="cs-title">
                    <MessageSquare size={24} />
                    Discussions
                    <span className="cs-count">{comments.length}</span>
                </div>
                <select className="cs-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Liked</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>

            {user ? (
                <div className="cs-editor">
                    <MentionInput
                        value={newValue}
                        onChange={setNewValue}
                        placeholder="Share your thoughts..."
                        disabled={submitting}
                        onMention={(uId) => setNewMentions(prev => [...prev, uId])}
                    />
                    <div className="cs-editor-actions">
                        <button
                            className="blog-btn blog-btn-primary"
                            onClick={handlePost}
                            disabled={submitting || !newValue.trim()}
                        >
                            {submitting ? <Loader2 className="blog-spin" size={18} /> : <Send size={18} />}
                            Post Comment
                        </button>
                    </div>
                </div>
            ) : (
                <div className="cs-auth-prompt">
                    <p>Join the conversation. Share your thoughts with other developers.</p>
                    <button className="blog-btn blog-btn-primary" onClick={() => navigate("/login")}>
                        <LogIn size={18} /> Sign in to Comment
                    </button>
                </div>
            )}

            {loading ? (
                <div className="cs-loading">
                    <Loader2 className="blog-spin" size={32} color="var(--blog-indigo-500)" />
                </div>
            ) : (
                <div className="cs-list">
                    {comments.length === 0 ? (
                        <div className="cs-empty">
                            <MessageSquare size={48} strokeWidth={1} />
                            <h3>No discussions yet</h3>
                            <p>Be the first to share your thoughts on this perspective. Start the conversation above.</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <CommentItem
                                key={comment._id}
                                comment={comment}
                                onReply={handleReply}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                depth={0}
                            />
                        ))
                    )}
                </div>
            )}
        </section>
    );
};

export default CommentSection;
