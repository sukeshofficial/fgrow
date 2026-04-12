import { LaunchSubscriber } from "../models/launch/LaunchSubscriber.model.js";
import { LaunchChatMessage } from "../models/launch/LaunchChatMessage.model.js";
import * as LaunchService from "../services/launch.service.js";

/**
 * Subscribe email for launch notification
 */
export const subscribe = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if already subscribed
        const existing = await LaunchSubscriber.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "You're already on the list! We'll notify you at launch." });
        }

        const subscriber = new LaunchSubscriber({
            email,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"]
        });

        await subscriber.save();

        res.status(201).json({
            message: "Success! We've added you to the launch notification list.",
            email: subscriber.email
        });
    } catch (error) {
        console.error("Subscription error:", error);
        res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
};

/**
 * Get chat messages
 */
export const getChatMessages = async (req, res) => {
    try {
        const messages = await LaunchChatMessage.find()
            .populate("user", "fullName email avatarUrl")
            .sort({ createdAt: -1 })
            .limit(100);

        // Reverse to show chronological order in UI
        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: "Failed to load messages" });
    }
};

/**
 * Send a chat message
 */
export const sendChatMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        const chatMessage = new LaunchChatMessage({
            user: req.user._id,
            message: message.trim()
        });

        await chatMessage.save();

        // Populate and return
        const populated = await LaunchChatMessage.findById(chatMessage._id).populate("user", "fullName email avatarUrl");
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: "Failed to send message" });
    }
};

/**
 * Trigger launch announcement manually (Admin only)
 */
export const triggerLaunchAnnouncement = async (req, res) => {
    try {
        const result = await LaunchService.runLaunchAnnouncement();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get all subscribers (for admin use)
 */
export const getSubscribers = async (req, res) => {

    try {
        const subscribers = await LaunchSubscriber.find().sort({ createdAt: -1 });
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
