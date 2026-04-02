import BillingEntity from "../models/billing/billingEntity.model.js";

export const listBillingEntities = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const entities = await BillingEntity.find({ tenant_id }).lean();
        return res.json({ success: true, data: entities });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};

export const createBillingEntity = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id;
        const { name, gstin, address } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        const newEntity = await BillingEntity.create({
            tenant_id,
            name,
            gstin,
            address
        });

        return res.status(201).json({ success: true, data: newEntity });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
};
