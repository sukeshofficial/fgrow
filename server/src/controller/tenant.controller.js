import { createTenantService } from "../services/tenant.service.js";
import { generateToken } from "../utils/jwt.js";

export const createTenant = async (req, res) => {
  try {
    const { tenant, user } = await createTenantService(req.body);

    // 7️⃣ Generate JWT
    const token = generateToken({
      id: user._id,
      tenantId: tenant._id,
      role: user.role,
    });

    res.status(201).json({
      message: "Tenant created successfully",
      token,
      user,
      tenant,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || "Something went wrong",
    });
  }
};
