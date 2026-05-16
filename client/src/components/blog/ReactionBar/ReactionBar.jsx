// client/src/components/blog/ReactionBar/ReactionBar.jsx
import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { api } from "../../../api/api";
import { useAuth } from "../../../hooks/useAuth";
import "./ReactionBar.css";

/**
 * ReactionBar — like/dislike with optimistic UI.
 * - Like count is public.
 * - Dislike is private: only the current *user* sees their own dislike state; no count shown.
 */
const ReactionBar = ({
    targetId,
    targetType = "BlogPost",
    initialLikes = 0,
    initialUserReaction = null,
    size = "normal",  // "normal" | "sm"
    onReactionChange = null, // callback for parent to sync stats
}) => {
    const { user } = useAuth();
    const [likes, setLikes] = useState(initialLikes);
    const [userReaction, setUserReaction] = useState(initialUserReaction);
    const [processing, setProcessing] = useState(false);

    // Sync with props if they change (e.g. parent re-refreshed)
    React.useEffect(() => {
        setLikes(initialLikes);
        setUserReaction(initialUserReaction);
    }, [initialLikes, initialUserReaction]);

    const react = async (type) => {
        if (!user) return;
        if (processing) return;

        // Optimistic update
        const prevLikes = likes;
        const prevReaction = userReaction;

        setProcessing(true);

        // Compute optimistic next state
        let nextLikes = likes;
        let nextReaction = null;

        if (userReaction === type) {
            // Toggle off
            nextReaction = null;
            if (type === "like") nextLikes = Math.max(0, likes - 1);
        } else {
            // If was liked and now disliking, subtract like
            if (userReaction === "like" && type === "dislike") nextLikes = Math.max(0, likes - 1);
            // If was disliked and now liking, add like
            if (userReaction === "dislike" && type === "like") nextLikes = likes + 1;
            // Fresh like
            if (userReaction === null && type === "like") nextLikes = likes + 1;
            nextReaction = type;
        }

        setLikes(nextLikes);
        setUserReaction(nextReaction);
        if (onReactionChange) onReactionChange(nextReaction, nextLikes);

        try {
            const res = await api.post(`/blog-social/reactions/${targetId}`, { targetType, type });
            if (res.data.success) {
                // Sync with server's source of truth
                setUserReaction(res.data.userReaction);
                // The likes count is harder to sync precisely from res, 
                // so we rely on the optimistic + subsequent fetch/prop sync
            }
        } catch (_) {
            // Rollback on error
            setLikes(prevLikes);
            setUserReaction(prevReaction);
            if (onReactionChange) onReactionChange(prevReaction, prevLikes);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className={`rb-wrap${size === "sm" ? " rb-sm" : ""}`}>
            <button
                className={`rb-btn rb-like${userReaction === "like" ? " active" : ""}`}
                onClick={() => react("like")}
                disabled={!user || processing}
                title={user ? "Like" : "Sign in to react"}
            >
                {processing && userReaction !== "dislike" ? (
                    <Loader2 size={14} className="blog-spin" />
                ) : (
                    <ThumbsUp size={size === "sm" ? 13 : 16} />
                )}
                <span className="rb-count">{likes}</span>
            </button>

            <button
                className={`rb-btn rb-dislike${userReaction === "dislike" ? " active" : ""}`}
                onClick={() => react("dislike")}
                disabled={!user || processing}
                title={user ? "Dislike" : "Sign in to react"}
            >
                {processing && userReaction !== "like" ? (
                    <Loader2 size={14} className="blog-spin" />
                ) : (
                    <ThumbsDown size={size === "sm" ? 13 : 16} />
                )}
                {/* No count shown for dislikes — private */}
            </button>
        </div>
    );
};

export default ReactionBar;
