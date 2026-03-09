import fs from "fs";

import {
  createTenantService,
  fetchPendingTenants,
  approveTenantService,
  rejectTenantService,
  reAppealTenantService,
} from "../services/tenant.service.js";

import { generateToken } from "../utils/jwt.js";
import { uploadToCloud } from "../utils/cloudinary.js";

export const createTenant = async (req, res) => {
  try {
    let logoData = {
      public_id: "",
      secure_url: "",
    };

    if (req.file) {
      const upload = await uploadToCloud(req.file.path);

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

      fs.unlinkSync(req.file.path);
      console.log(`File - ${req.file.path} deleted`);
    }

    const { tenant, user } = await createTenantService({
      ...req.body,
      logoUrl: logoData.secure_url,
    });

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
    console.error("Get Pending Tenants Error:", err);
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

    const result = await approveTenantService(tenantId, req.user.id);

    if (result.error) {
      return res.status(result.status).json({
        message: result.error,
      });
    }

    return res.status(200).json({
      message: "Tenant approved successfully",
      tenantId: result.tenant._id,
    });
  } catch (err) {
    console.error("Approve Tenant Error:", err);
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
    console.error("Reject Tenant Error:", err);
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

    const tenant = await reAppealTenantService(user.tenant_id, user.id);

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
