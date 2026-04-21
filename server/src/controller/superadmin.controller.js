import { User } from "../models/auth/user.model.js";
import logger from "../utils/logger.js";

// GET ALL USERS (Super Admin)
export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find({})
      .populate("tenant_id", "name companyEmail logoUrl verificationStatus")
      .sort({ joined_at: -1 });

    const grouped = {};

    users.forEach(user => {
      const tenantName = user.tenant_id ? user.tenant_id.name : "Unassigned";
      if (!grouped[tenantName]) {
        grouped[tenantName] = {
          tenant: user.tenant_id,
          seen: new Set(),
          users: [],
        };
      }
      // Deduplicate by email — skip if we've already added this email for this tenant
      if (!grouped[tenantName].seen.has(user.email)) {
        grouped[tenantName].seen.add(user.email);
        grouped[tenantName].users.push(user);
      }
    });

    const groupedArray = Object.entries(grouped).map(([name, data]) => {
      data.users.sort((a, b) => {
        if (a.tenant_role === "owner" && b.tenant_role !== "owner") return -1;
        if (b.tenant_role === "owner" && a.tenant_role !== "owner") return 1;

        const nameA = a.name ? a.name.toLowerCase() : "";
        const nameB = b.name ? b.name.toLowerCase() : "";
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });

      return {
        tenantName: name,
        tenantData: data.tenant,
        users: data.users,
      };
    });

    groupedArray.sort((a, b) => {
      if (a.tenantName === "Unassigned") return 1;
      if (b.tenantName === "Unassigned") return -1;
      return a.tenantName.localeCompare(b.tenantName);
    });

    res.status(200).json({
      success: true,
      data: groupedArray,
    });
  } catch (error) {
    logger.error("getAllUsersAdmin Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent deletion of super admins
    if (user.platform_role === "super_admin") {
      return res.status(403).json({ message: "Cannot delete super admin" });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    logger.error("deleteUserAdmin Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forceLogoutUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.token_version = (user.token_version || 0) + 1;
    user.status = "inactive";
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: "User force logged out successfully" });
  } catch (error) {
    logger.error("forceLogoutUserAdmin Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
