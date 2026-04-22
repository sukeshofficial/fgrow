import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Trash2, ExternalLink, X } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import "./NotificationDropdown.css";


export default function NotificationDropdown() {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshNotifications
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Still need this for clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await markAsRead(id);
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    return (
        <div className="notification-dropdown-container" ref={dropdownRef}>
            <button
                className="notification-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="mark-all-read">
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading && notifications.length === 0 ? (
                            <div className="notification-empty">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">No notifications</div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${notification.is_read ? "read" : "unread"}`}
                                >
                                    <div className="notification-content">
                                        <p className="notification-title">{notification.title}</p>
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-time">
                                            {new Date(notification.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    <div className="notification-actions">
                                        {!notification.is_read && (
                                            <button
                                                onClick={(e) => handleMarkAsRead(notification._id, e)}
                                                title="Mark as read"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                        {notification.link && (
                                            <Link
                                                to={notification.link}
                                                onClick={() => setIsOpen(false)}
                                                title="View"
                                            >
                                                <ExternalLink size={16} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="notification-footer">
                        <Link to="/notifications" onClick={() => setIsOpen(false)}>
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
