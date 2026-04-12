import Notification from "../models/notification/notification.model.js";
import logger from "../utils/logger.js";

/**
 * Get all notifications for the current user
 */
export const getNotifications = async (req, res) => {
    try {
        const { id: userId, tenant_id } = req.user;

        const notifications = await Notification.find({
            recipient: userId,
            tenant_id
        })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            tenant_id,
            is_read: false
        });

        res.status(200).json({
            notifications,
            unreadCount
        });
    } catch (err) {
        logger.error("Error fetching notifications:", err);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId } = req.user;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { is_read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json(notification);
    } catch (err) {
        logger.error("Error marking notification as read:", err);
        res.status(500).json({ message: "Error marking notification as read" });
    }
};

/**
 * Mark all notifications as read for current user
 */
export const markAllAsRead = async (req, res) => {
    try {
        const { id: userId, tenant_id } = req.user;

        await Notification.updateMany(
            { recipient: userId, tenant_id, is_read: false },
            { is_read: true }
        );

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (err) {
        logger.error("Error marking all notifications as read:", err);
        res.status(500).json({ message: "Error marking all notifications as read" });
    }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId } = req.user;

        const notification = await Notification.findOneAndDelete({ _id: id, recipient: userId });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted" });
    } catch (err) {
        logger.error("Error deleting notification:", err);
        res.status(500).json({ message: "Error deleting notification" });
    }
};
