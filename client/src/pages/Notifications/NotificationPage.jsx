import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Trash2, ExternalLink, RefreshCw } from "lucide-react";

import SideBar from "../../components/SideBar";
import ScrollingCredits from "../../components/dashboard/ScrollingCredits";
import { useNotifications } from "../../context/NotificationContext";

import "./NotificationPage.css";

export default function NotificationPage() {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications
    } = useNotifications();
    const [filter, setFilter] = useState("all"); // 'all', 'unread'

    const handleMarkAsRead = async (id) => {
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

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id);
        } catch (err) {
            console.error("Failed to delete notification", err);
        }
    };


    const filteredNotifications = filter === "all"
        ? notifications
        : notifications.filter(n => !n.is_read);

    return (
        <>
            <SideBar />
            <div className="dashboard notifications-page-wrapper">
                <ScrollingCredits />
                <div className="page-header-row">
                    <h1 className="dashboard-title">Notifications</h1>
                    <div className="header-badge">
                        <span className="unread-count">{unreadCount}</span>
                        <span className="unread-label">Unread</span>
                    </div>
                    <div className="header-actions">
                        <button onClick={refreshNotifications} className="refresh-btn" title="Refresh">
                            <RefreshCw size={18} className={loading ? "spin" : ""} />
                        </button>

                        <button
                            onClick={handleMarkAllRead}
                            className="mark-read-btn"
                            disabled={unreadCount === 0}
                        >
                            Mark all as read
                        </button>
                    </div>
                </div>

                <div className="notification-tabs">
                    <button
                        className={`tab-btn ${filter === "all" ? "active" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        All
                    </button>
                    <button
                        className={`tab-btn ${filter === "unread" ? "active" : ""}`}
                        onClick={() => setFilter("unread")}
                    >
                        Unread
                    </button>
                </div>

                <div className="notifications-content">

                    {loading && notifications.length === 0 ? (
                        <div className="loading-state">Loading notifications...</div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="empty-state">
                            <Bell size={48} />
                            <p>No notifications found</p>
                        </div>
                    ) : (
                        <div className="notification-list-full">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-card ${notification.is_read ? "read" : "unread"}`}
                                >
                                    <div className="card-icon">
                                        <Bell size={20} />
                                    </div>
                                    <div className="card-content">
                                        <h3>{notification.title}</h3>
                                        <p>{notification.message}</p>
                                        <span className="timestamp">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="card-actions">
                                        {!notification.is_read && (
                                            <button onClick={() => handleMarkAsRead(notification._id)} title="Mark as read">
                                                <Check size={18} />
                                            </button>
                                        )}
                                        {notification.link && (
                                            <Link to={notification.link} title="View Details">
                                                <ExternalLink size={18} />
                                            </Link>
                                        )}
                                        <button onClick={() => handleDelete(notification._id)} className="delete-btn" title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
