// client/src/components/blog/MentionInput/MentionInput.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../../api/api";
import "./MentionInput.css";

const MentionInput = ({ value, onChange, placeholder, disabled, onMention }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionMap, setMentionMap] = useState({}); // Stores known user avatars
    const textareaRef = useRef(null);
    const highlightsRef = useRef(null);

    const searchUsers = useCallback(async (q) => {
        if (!q || q.length < 2) {
            setUsers([]);
            return;
        }
        try {
            const res = await api.get(`/blog-social/users/search?q=${q}`);
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            console.error("Search users error:", err);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) searchUsers(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, searchUsers]);

    const handleInput = (e) => {
        const valet = e.target.value;
        const cursor = e.target.selectionStart;
        onChange(valet);

        const textBefore = valet.substring(0, cursor);
        const lastAt = textBefore.lastIndexOf("@");

        if (lastAt !== -1 && lastAt >= textBefore.lastIndexOf(" ")) {
            const q = textBefore.substring(lastAt + 1);
            setQuery(q);
            setShowDropdown(true);
        } else {
            setShowDropdown(false);
            setQuery("");
        }
    };

    const handleScroll = (e) => {
        if (highlightsRef.current) {
            highlightsRef.current.scrollTop = e.target.scrollTop;
            highlightsRef.current.scrollLeft = e.target.scrollLeft;
        }
    };

    const insertMention = (user) => {
        const cursor = textareaRef.current.selectionStart;
        const textBefore = value.substring(0, cursor);
        const lastAt = textBefore.lastIndexOf("@");
        const textAfter = value.substring(cursor);

        const newValue = textBefore.substring(0, lastAt) + `@${user.name} ` + textAfter;
        onChange(newValue);
        setShowDropdown(false);
        setQuery("");

        // Cache the avatar for the highlight overlay
        const avatarUrl = typeof user.avatar === 'string' ? user.avatar : user.profile_avatar?.secure_url;
        setMentionMap(prev => ({ ...prev, [user.name]: avatarUrl || null }));

        // Pass back to parent if requested
        if (onMention) {
            onMention(user._id);
        }

        // Focus back and set cursor
        setTimeout(() => {
            textareaRef.current.focus();
            const newCursor = lastAt + user.name.length + 2;
            textareaRef.current.setSelectionRange(newCursor, newCursor);
        }, 0);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) => (i + 1) % Math.max(1, users.length));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => (i - 1 + users.length) % Math.max(1, users.length));
        } else if (e.key === "Enter" || e.key === "Tab") {
            if (users[selectedIndex]) {
                e.preventDefault();
                insertMention(users[selectedIndex]);
            }
        } else if (e.key === "Escape") {
            setShowDropdown(false);
        }
    };

    const renderHighlights = (text) => {
        if (!text) return "";
        let result = [text];

        // Match cached users and render them as chips
        Object.keys(mentionMap).forEach(name => {
            const mentionStr = `@${name}`;
            const newResult = [];
            result.forEach(part => {
                if (typeof part === 'string') {
                    const chunks = part.split(mentionStr);
                    for (let i = 0; i < chunks.length; i++) {
                        newResult.push(chunks[i]);
                        if (i < chunks.length - 1) {
                            newResult.push(
                                <span key={`${name}-${i}`} className="mi-chip">
                                    <span>{mentionStr}</span>
                                </span>
                            );
                        }
                    }
                } else {
                    newResult.push(part);
                }
            });
            result = newResult;
        });

        // Basic highlights for untracked emails/mentions just in case
        return result.map((part, i) => {
            if (typeof part === 'string' && part !== "") {
                return <span key={`text-${i}`}>{part}</span>;
            }
            return part;
        });
    };

    return (
        <div className="mi-container">
            <div className="mi-text-wrapper">
                <textarea
                    ref={textareaRef}
                    className="mi-textarea"
                    value={value}
                    onChange={handleInput}
                    onScroll={handleScroll}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    spellCheck="false"
                />
                <div className="mi-highlights" ref={highlightsRef} aria-hidden="true">
                    {renderHighlights(value)}
                    {value.endsWith("\n") && <br />}
                </div>
            </div>

            {showDropdown && users.length > 0 && (
                <div className="mi-dropdown">
                    {users.map((user, i) => (
                        <div
                            key={user._id}
                            className={`mi-item${i === selectedIndex ? " active" : ""}`}
                            onClick={() => insertMention(user)}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <div className="mi-avatar">
                                {(() => {
                                    const avatarUrl = typeof user.avatar === 'string' ? user.avatar : user.profile_avatar?.secure_url;
                                    return avatarUrl ? (
                                        <img src={avatarUrl} alt="" />
                                    ) : (
                                        user.name.charAt(0).toUpperCase()
                                    );
                                })()}
                            </div>
                            <div className="mi-info">
                                <span className="mi-name">{user.name}</span>
                                <span className="mi-email">{user.email}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentionInput;

