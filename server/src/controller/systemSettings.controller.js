import { SystemSettings } from "../models/system/systemSettings.model.js";

/**
 * Ensures system settings map is initialized, or fetches the value securely
 */
const getSettingValue = async (key, defaultValue) => {
    let setting = await SystemSettings.findOne({ key });
    if (!setting) {
        setting = await SystemSettings.create({ key, value: defaultValue });
    }
    return setting.value;
};

/**
 * Super Admin: Get all settings
 * GET /api/v0/system/settings
 */
export const getAllSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.find({});

        let feedbackInterval = 10;
        const fiSetting = settings.find(s => s.key === "feedback_logout_interval");
        if (fiSetting) {
            feedbackInterval = fiSetting.value;
        } else {
            feedbackInterval = await getSettingValue("feedback_logout_interval", 10);
        }

        res.status(200).json({
            success: true,
            data: {
                feedback_logout_interval: feedbackInterval,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Public/Any User: Get public settings only (for client-side rules without auth)
 * GET /api/v0/system/settings/public
 */
export const getPublicSettings = async (req, res) => {
    try {
        const feedbackInterval = await getSettingValue("feedback_logout_interval", 10);

        res.status(200).json({
            success: true,
            data: {
                feedback_logout_interval: feedbackInterval
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Super Admin: Edit settings
 * PATCH /api/v0/system/settings
 */
export const updateSettings = async (req, res) => {
    try {
        const updates = req.body; // e.g., { feedback_logout_interval: 15 }

        for (const [key, val] of Object.entries(updates)) {
            await SystemSettings.findOneAndUpdate(
                { key },
                { value: val },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({
            success: true,
            message: "Settings updated successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
