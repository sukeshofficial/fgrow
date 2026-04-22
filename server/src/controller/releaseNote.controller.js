import ReleaseNote from "../models/launch/releaseNote.model.js";
import { User } from "../models/auth/user.model.js";
import logger from "../utils/logger.js";

/**
 * Create a new Release Note (Admin only)
 */
export const createReleaseNote = async (req, res) => {
    try {
        const { version, type, title, features } = req.body;

        if (!version || !type || !title || !features || !Array.isArray(features)) {
            return res.status(400).json({ message: "Version, type, title, and features (array) are required" });
        }

        // Check if version already exists
        const existing = await ReleaseNote.findOne({ version });
        if (existing) {
            return res.status(400).json({ message: "This version already exists" });
        }

        // Sanitize: Remove fields that shouldn't be set directly or are immutable
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.__v;

        const releaseNote = new ReleaseNote({
            ...updateData,
            createdBy: req.user.id,
        });

        await releaseNote.save();
        res.status(201).json({ message: "Release note created successfully", releaseNote });
    } catch (err) {
        logger.error("Error creating release note:", err);
        res.status(500).json({ message: err.message || "Internal server error" });
    }
};

/**
 * Update a Release Note (Admin only)
 */
export const updateReleaseNote = async (req, res) => {
    try {
        const { id } = req.params;

        // Sanitize update data
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.__v;

        const release = await ReleaseNote.findByIdAndUpdate(
            id,
            { ...updateData, updatedBy: req.user.id },
            { new: true, runValidators: true }
        );

        if (!release) return res.status(404).json({ message: "Release note not found" });
        res.json({ message: "Release note updated successfully", release });
    } catch (err) {
        logger.error("Error updating release note:", err);
        res.status(500).json({ message: err.message || "Internal server error" });
    }
};

/**
 * Get all Release Notes (Admin only)
 */
export const getAllReleaseNotes = async (req, res) => {
    try {
        const releaseNotes = await ReleaseNote.find().sort({ createdAt: -1 }).populate("createdBy", "name email");
        res.json(releaseNotes);
    } catch (err) {
        logger.error("Error fetching release notes:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Get Latest Active Release Note (User)
 */
export const getLatestReleaseNote = async (req, res) => {
    try {
        const now = new Date();

        // Find releases that are:
        // 1. Published
        // 2. Already published (publishAt <= now)
        // 3. Not expired (expireAt is null OR expireAt > now)
        // 4. Matches audience (simplified to 'all' or specific checks)

        const query = {
            status: { $in: ["published", "scheduled"] },
            publishAt: { $lte: now },
            $or: [
                { expireAt: { $exists: false } },
                { expireAt: null },
                { expireAt: { $gt: now } }
            ]
        };

        // Filter by audience
        if (req.user.platform_role !== "super_admin") {
            // If user is not super_admin, they can see 'all' or 'users'
            // (Extend this logic as needed for specific roles)
            query.audience = { $in: ["all", "users"] };
        }

        // Get the most recent one by publishAt or priority
        const releaseNote = await ReleaseNote.findOne(query).sort({ priority: -1, publishAt: -1 });

        if (!releaseNote) {
            return res.status(404).json({ message: "No active release notes found" });
        }
        res.json(releaseNote);
    } catch (err) {
        logger.error("Error fetching latest release note:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Mark version as seen for user
 */
export const markAsSeen = async (req, res) => {
    try {
        const { version } = req.body;
        if (!version) return res.status(400).json({ message: "Version is required" });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.last_seen_version = version;
        await user.save();

        res.json({ message: "Version marked as seen", last_seen_version: user.last_seen_version });
    } catch (err) {
        logger.error("Error marking version as seen:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Delete Release Note (Admin only)
 */
export const deleteReleaseNote = async (req, res) => {
    try {
        const { id } = req.params;
        await ReleaseNote.findByIdAndDelete(id);
        res.json({ message: "Release note deleted successfully" });
    } catch (err) {
        logger.error("Error deleting release note:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Toggle Active Status (Admin only)
 */
export const toggleReleaseActive = async (req, res) => {
    try {
        const { id } = req.params;
        const release = await ReleaseNote.findById(id);
        if (!release) return res.status(404).json({ message: "Release note not found" });

        if (!release.isActive) {
            // Deactivate all others before activating this one
            await ReleaseNote.updateMany({}, { isActive: false });
        }

        release.isActive = !release.isActive;
        await release.save();

        res.json({ message: `Release set to ${release.isActive ? 'active' : 'inactive'}`, release });
    } catch (err) {
        logger.error("Error toggling release status:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Reset Release History for Everyone (Admin only)
 * Sets last_seen_version to "" for all users
 */
export const resetAllUsersVersion = async (req, res) => {
    try {
        await User.updateMany({}, { last_seen_version: "" });
        res.json({ message: "Release history reset for all users successfully" });
    } catch (err) {
        logger.error("Error resetting all users version:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Get Published Release Notes History (User)
 */
export const getReleaseNotesHistory = async (req, res) => {
    try {
        const now = new Date();

        const query = {
            status: { $in: ["published", "scheduled"] },
            publishAt: { $lte: now },
            $or: [
                { expireAt: { $exists: false } },
                { expireAt: null },
                { expireAt: { $gt: now } }
            ]
        };

        if (req.user.platform_role !== "super_admin") {
            query.audience = { $in: ["all", "users"] };
        }

        const releaseNotes = await ReleaseNote.find(query).sort({ priority: -1, publishAt: -1 });

        if (!releaseNotes || releaseNotes.length === 0) {
            return res.status(404).json({ message: "No active release notes found" });
        }
        res.json(releaseNotes);
    } catch (err) {
        logger.error("Error fetching release notes history:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
