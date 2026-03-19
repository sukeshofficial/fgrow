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
