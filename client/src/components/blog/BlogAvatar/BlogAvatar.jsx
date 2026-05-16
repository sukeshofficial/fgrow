// client/src/components/blog/BlogAvatar/BlogAvatar.jsx
import React from 'react';
import './BlogAvatar.css';

/**
 * Unified Avatar Component for FGrow Blog
 * @param {Object} user - User object containing name and avatar
 * @param {string} size - CSS size value (e.g. "32px")
 * @param {string} className - Optional extra classes
 */
const BlogAvatar = ({ user, size = "32px", className = "" }) => {
    if (!user) return null;

    const initials = user.name ? user.name.charAt(0).toUpperCase() : '?';
    // Handle both object-style (secure_url) and string-style avatar properties
    const avatarUrl = typeof user.avatar === 'string' ? user.avatar : user.profile_avatar?.secure_url;

    return (
        <div
            className={`blog-avatar ${className}`}
            style={{ width: size, height: size, fontSize: `calc(${size} * 0.45)` }}
            title={user.name}
        >
            {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
};

export default BlogAvatar;
