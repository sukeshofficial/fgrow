import {
  createTenantService,
  fetchPendingTenants,
  approveTenantService,
  rejectTenantService,
  reAppealTenantService,
  fetchAllTenantsService,
  fetchTenantByIdService,
  verifyGstAdminService,
} from "../services/tenant.service.js";
import { User } from "../models/auth/user.model.js";
import Client from "../models/client/client.model.js";

import { generateToken } from "../utils/jwt.js";
import { uploadBufferToCloud } from "../utils/cloudinary.js";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

export const createTenant = async (req, res) => {
  try {
    let logoData = {
      public_id: "",
      secure_url: "",
    };

    if (req.file) {
      const upload = await uploadBufferToCloud(req.file.buffer, "tenants");

      if (!upload.success) {
        return res.status(500).json({
          message: "Image upload failed",
          error: upload.error,
        });
      }

      logoData = {
        public_id: upload.public_id,
        secure_url: upload.secure_url,
      };
    }

    const { tenant, user } = await createTenantService({
      ...req.body,
      logoUrl: logoData.secure_url,
    });

    // Send Notification Email to Super Admin
    try {
      await sendEmail({
        from: `"FGrow System" <${process.env.EMAIL_USER}>`,
        to: "sukesh.official.2006@gmail.com",
        subject: `🚀 New Tenant Alert: ${tenant.name}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <!-- Circular Image -->
            <div style="text-align: center; margin-bottom: 20px;">
              <img 
                src="https://res.cloudinary.com/dbaeuihz7/image/upload/v1775310579/tenants/a7tvcuo0moqztzeoevaz.png" 
                alt="Profile"
                style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #e0e0e0;"
              />
            </div>
            <h2 style="color: #4f46e5;">New Tenant Registration</h2>
            <p>A new organization has just signed up on FGrow.</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p><strong>Organization:</strong> ${tenant.name}</p>
            <p><strong>Owner Name:</strong> ${user.name}</p>
            <p><strong>Owner Email:</strong> ${user.email}</p>
            <p><strong>Company Email:</strong> ${tenant.companyEmail}</p>
            <p><strong>Submitted On:</strong> ${new Date(tenant.createdAt).toLocaleString()}</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 0.9em; color: #666;">
              Log in to the <a href="https://fg-crm-super-admin.vercel.app/admin" style="color: #4f46e5;">Super Admin Dashboard</a> to review and approve this tenant.
            </p>
          </div>
        `
      });
      logger.info("Creation notification email sent to admin");
    } catch (emailErr) {
      logger.error("Failed to send admin notification email:", emailErr);
      // Don't fail the whole request if email fails
    }

    // 7️⃣ Generate JWT (unnecessary process rn.)
    const token = generateToken({
      id: user._id,
      tenant_id: tenant._id,
      tenant_role: user.tenant_role,
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

// --------------------------------------------------
// 1️⃣ Get All Pending Tenants
// --------------------------------------------------
export const getPendingTenants = async (req, res) => {
  try {
    const tenants = await fetchPendingTenants();

    return res.status(200).json({
      message: "Pending tenants fetched",
      count: tenants.length,
      tenants,
    });
  } catch (err) {
    logger.error("Get Pending Tenants Error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

// --------------------------------------------------
// 2️⃣ Approve Tenant
// --------------------------------------------------
export const approveTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    logger.info(`Approve tenant request reached for ID: ${tenantId} by admin: ${req.user?.id}`);
    const result = await approveTenantService(tenantId, req.user?.id);

    if (result.error) {
      logger.info(`Approve tenant service returned error: ${result.error}`);
      return res.status(result.status).json({
        message: result.error,
      });
    }

    logger.info(`Tenant approved successfully: ${tenantId}`);
    return res.status(200).json({
      message: "Tenant approved successfully",
      tenantId: result.tenant._id,
    });
  } catch (err) {
    logger.error("Approve Tenant Error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

// --------------------------------------------------
// 3️⃣ Reject Tenant
// --------------------------------------------------
export const rejectTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    const result = await rejectTenantService(tenantId, reason, req.user.id);

    if (result.error) {
      return res.status(result.status).json({
        message: result.error,
      });
    }

    return res.status(200).json({
      message: "Tenant rejected",
      tenantId: result.tenant._id,
    });
  } catch (err) {
    logger.error("Reject Tenant Error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

// --------------------------------------------------
// 4️⃣ Re-appeal Tenant
// --------------------------------------------------
export const reAppealTenant = async (req, res) => {
  try {
    const user = req.user;

    if (!user.tenant_id) {
      return res.status(400).json({
        message: "User does not belong to any tenant",
      });
    }

    const { name, companyEmail, companyPhone, gstNumber, registrationNumber, timezone, currency, companyAddress } = req.body;

    const tenant = await reAppealTenantService(user.tenant_id, user.id, {
      name,
      companyEmail,
      companyPhone,
      gstNumber,
      registrationNumber,
      timezone,
      currency,
      companyAddress,
    });

    return res.status(200).json({
      message: "Re-appeal submitted successfully",
      tenantStatus: tenant.verificationStatus,
      appealCount: tenant.appealCount,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
};

// --------------------------------------------------
// 5️⃣ Get Tenant Staff (Joiners)
// --------------------------------------------------
export const getTenantStaff = async (req, res) => {
  try {
    const { User } = await import("../models/auth/user.model.js");

    // Deduplicate by email — keep only the most recently joined record per email
    const users = await User.aggregate([
      { $match: { tenant_id: req.user.tenant_id } },
      { $sort: { joined_at: -1 } },
      { $group: { _id: "$email", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { joined_at: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    logger.error("Get Tenant Staff Error:", err);
    return res.status(500).json({
      message: err.message || "internal server error",
    });
  }
};

// --------------------------------------------------
// 6️⃣ Get All Tenants (Pending, Approved, etc.)
// --------------------------------------------------
export const getAllTenants = async (req, res) => {
  try {
    const { status } = req.query; // optional filter
    const tenants = await fetchAllTenantsService(status);

    return res.status(200).json({
      success: true,
      data: tenants,
    });
  } catch (err) {
    logger.error("Get All Tenants Error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

// --------------------------------------------------
// 7️⃣ Get Tenant By ID
// --------------------------------------------------
export const getTenantById = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Authorization: Super Admin can see any; Owner/Staff only their own.
    const isSuperAdmin = req.user.platform_role === "super_admin";
    const isOwnerOrStaffOfThisTenant = req.user.tenant_id?.toString() === tenantId;

    if (!isSuperAdmin && !isOwnerOrStaffOfThisTenant) {
      return res.status(403).json({
        message: "forbidden: you can only access your own organization details",
      });
    }

    const tenant = await fetchTenantByIdService(tenantId);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    return res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (err) {
    logger.error("Get Tenant By ID Error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

// --------------------------------------------------
// 8️⃣ Admin: Get Targeted Tenant Staff
// --------------------------------------------------
export const getTenantStaffAdmin = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { Types } = await import("mongoose");

    // Deduplicate by email — keep only the most recently joined record per email
    const users = await User.aggregate([
      { $match: { tenant_id: new Types.ObjectId(tenantId) } },
      { $sort: { joined_at: -1 } },
      { $group: { _id: "$email", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      {
        $project: {
          name: 1, email: 1, username: 1,
          tenant_role: 1, status: 1, joined_at: 1, profile_avatar: 1
        }
      },
      { $sort: { joined_at: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    logger.error("Get Tenant Staff Admin Error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

// --------------------------------------------------
// 9️⃣ Admin: Get Targeted Tenant Clients
// --------------------------------------------------
export const getTenantClientsAdmin = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const clients = await Client.find({ tenant_id: tenantId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (err) {
    logger.error("Get Tenant Clients Admin Error:", err);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

// --------------------------------------------------
// 10️ Remove User From Tenant (Owner Only)
// --------------------------------------------------
export const removeUserFromTenant = async (req, res) => {
  try {
    const { userId } = req.params;
    const { id: ownerId, tenant_id: ownerTenantId } = req.user;

    if (!ownerTenantId) {
      return res.status(403).json({ message: "You are not associated with any organization" });
    }

    const owner = await User.findById(ownerId);
    if (!owner || owner.tenant_role !== "owner" || owner.tenant_id?.toString() !== ownerTenantId.toString()) {
      return res.status(403).json({ message: "Only organization owners can remove members" });
    }

    const userToRemove = await User.findById(userId);
    if (!userToRemove || userToRemove.tenant_id?.toString() !== ownerTenantId.toString()) {
      return res.status(404).json({ message: "User not found in your organization" });
    }

    if (userToRemove.tenant_role === "owner" || userToRemove._id.toString() === ownerId.toString()) {
      return res.status(400).json({ message: "Cannot remove the organization owner" });
    }

    userToRemove.tenant_id = null;
    userToRemove.tenant_role = "none";
    await userToRemove.save();

    res.json({ message: "User removed from organization successfully" });
  } catch (err) {
    logger.error("Remove User From Tenant Error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

// --------------------------------------------------
// 11️ Update Tenant (Owner Only)
// --------------------------------------------------
export const updateTenant = async (req, res) => {
  try {
    const { tenant_id: tenantId } = req.user;
    const updates = req.body;

    // Handle Logo Upload if present
    if (req.file) {
      const uploadResult = await uploadBufferToCloud(req.file.buffer, "tenants");
      if (!uploadResult.success) {
        return res.status(500).json({ message: "Logo upload failed", error: uploadResult.error });
      }
      updates.logoUrl = uploadResult.secure_url;
    }

    const { updateTenantService } = await import("../services/tenant.service.js");
    const tenant = await updateTenantService(tenantId, updates);

    return res.status(200).json({
      success: true,
      message: "Organization details updated successfully",
      data: tenant,
    });
  } catch (err) {
    logger.error("Update Tenant Error:", err);
    return res.status(400).json({
      message: err.message || "Failed to update organization details",
    });
  }
};

/**
 * Remove Organization Logo
 */
export const removeLogo = async (req, res) => {
  try {
    const { tenant_id: tenantId } = req.user;
    const Tenant = (await import("../models/tenant/tenant.model.js")).default;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    if (tenant.logoUrl) {
      // If it's a Cloudinary URL, we'd ideally delete it, but Cloudinary deletion 
      // usually requires the public_id. In createTenant, we don't seem to store the public_id for logoUrl.
      // Let's check if we can extract it or if we should just clear the URL.
      // For now, we'll just clear the URL as per createTenant's pattern of only storing logoUrl.
    }

    tenant.logoUrl = undefined;
    await tenant.save();

    res.json({ message: "Organization logo removed successfully", data: tenant });
  } catch (err) {
    logger.error("Error removing logo:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Verify GST by Admin (Locking verification)
 */
export const verifyGstAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await verifyGstAdminService(id);
    res.status(200).json({
      success: true,
      message: "GST verified by admin successfully",
      data: tenant,
    });
  } catch (err) {
    logger.error("Verify GST Admin Error:", err);
    res.status(400).json({
      message: err.message || "Failed to verify GST by admin",
    });
  }
};
