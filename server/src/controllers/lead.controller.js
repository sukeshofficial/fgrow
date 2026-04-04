import { Lead } from "../models/lead/lead.model.js";
import logger from "../utils/logger.js";

export const createLead = async (req, res) => {
    try {
        const { name, email, companyName } = req.body;

        if (!name || !email || !companyName) {
            return res.status(400).json({ message: "Name, Work Email, and Company Name are required." });
        }

        let lead = await Lead.findOne({ email: email.toLowerCase() });

        if (lead) {
            lead.name = name;
            lead.companyName = companyName;
            await lead.save();
            return res.status(200).json({ message: "Lead updated successfully.", leadId: lead._id });
        }

        lead = new Lead({ name, email, companyName });
        await lead.save();

        res.status(201).json({ message: "Lead captured successfully.", leadId: lead._id });
    } catch (error) {
        logger.error("Error creating lead:", error);
        res.status(500).json({ message: "Failed to capture lead. Please try again." });
    }
};
