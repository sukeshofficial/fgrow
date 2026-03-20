import Tenant from "../models/tenant/tenant.model.js";
import { User } from "../models/auth/user.model.js";
import slugify from "slugify";

export const createTenantService = async (data) => {
  const {
    companyName,
    companyEmail,
    companyPhone,
    email,
    logoUrl,
    gstin,
    officialAddress,
    gstCertificate,
  } = data;

  // 1️⃣ Find user
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User with this email does not exist");
  }

  // 2️⃣ Check if tenant already exists with same name/email/phone
  const existingTenant = await Tenant.findOne({
    $or: [
      { name: companyName },
      { companyEmail: companyEmail },
      { companyPhone: companyPhone }
    ]
  });

  if (existingTenant) {
    if (existingTenant.name === companyName) {
      throw new Error("Tenant with this company name already exists");
    }
    if (existingTenant.companyEmail === companyEmail) {
      throw new Error("Tenant with this company email already exists");
    }
    if (existingTenant.companyPhone === companyPhone) {
      throw new Error("Tenant with this company phone already exists");
    }
  }

  // 3️⃣ Check if user already belongs to a tenant
  if (user.tenant_id) {
    throw new Error(`User already belongs to a tenant`);
  }

  // 4️⃣ Create tenant
  const tenant = new Tenant({
    name: companyName,
    companyEmail,
    companyPhone,
    domain: slugify(companyName, { lower: true }),
    logoUrl,
    gstNumber: gstin,
    officialAddress,
    gstCertificate,
  });

  // 5️⃣ Attach user to tenant
  user.tenant_id = tenant._id;
  user.tenant_role = "owner";
  user.status = "active";
  await user.save();

  // 6️⃣ Attach owner
  tenant.ownerUserId = user._id;

  // 7️⃣ Save tenant
  await tenant.save();

  return { tenant, user };
};

// --------------------------------------------------
// 1️⃣ Get All Pending Tenants
// --------------------------------------------------
export const fetchPendingTenants = async () => {
  return await Tenant.find({
    verificationStatus: "pending",
  }).populate("ownerUserId", "name email");
};

// --------------------------------------------------
// 2️⃣ Approve Tenant
// --------------------------------------------------
export const approveTenantService = async (tenantId, adminId) => {
  const tenant = await Tenant.findById(tenantId);

  if (!tenant) {
    return { error: "Tenant not found", status: 404 };
  }

  if (tenant.verificationStatus === "verified") {
    return { error: "Tenant already approved", status: 400 };
  }

  tenant.verificationStatus = "verified";
  tenant.verifiedBy = adminId;
  tenant.verifiedAt = new Date();
  tenant.rejection_reason = null;

  await tenant.save();

  return { tenant };
};

// --------------------------------------------------
// 3️⃣ Reject Tenant
// --------------------------------------------------
export const rejectTenantService = async (tenantId, reason, adminId) => {
  if (!reason) {
    return { error: "Rejection reason is required", status: 400 };
  }

  const tenant = await Tenant.findById(tenantId);

  if (!tenant) {
    return { error: "Tenant not found", status: 404 };
  }

  tenant.verificationStatus = "rejected";
  tenant.rejection_reason = reason;
  tenant.verifiedBy = adminId;
  tenant.verifiedAt = new Date();

  await tenant.save();

  return { tenant };
};

// --------------------------------------------------
// 4️⃣ Re-appeal Tenant
// --------------------------------------------------
export const reAppealTenantService = async (tenantId, userId, updates = {}) => {
  const tenant = await Tenant.findById(tenantId);

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  if (tenant.verificationStatus !== "rejected") {
    throw new Error("Tenant is not rejected");
  }

  // Optional: limit appeals
  if (tenant.appealCount >= 3) {
    throw new Error("Maximum appeal attempts reached");
  }

  // Apply updated company details if provided
  if (updates.name) {
    tenant.name = updates.name;
    tenant.domain = slugify(updates.name, { lower: true });
  }
  if (updates.companyEmail) tenant.companyEmail = updates.companyEmail;
  if (updates.companyPhone) tenant.companyPhone = updates.companyPhone;
  if (updates.gstNumber) tenant.gstNumber = updates.gstNumber;
  if (updates.registrationNumber) tenant.registrationNumber = updates.registrationNumber;
  if (updates.timezone) tenant.timezone = updates.timezone;
  if (updates.currency) tenant.currency = updates.currency;
  if (updates.companyAddress) tenant.companyAddress = updates.companyAddress;

  tenant.verificationStatus = "pending";
  tenant.rejection_reason = null;
  tenant.appealCount += 1;
  tenant.lastAppealedAt = new Date();
  tenant.verifiedBy = null;
  tenant.verifiedAt = null;

  await tenant.save();

  return tenant;
};

// --------------------------------------------------
// 5️⃣ Fetch All Tenants (with status filter)
// --------------------------------------------------
export const fetchAllTenantsService = async (status) => {
  const query = {};
  if (status) {
    query.verificationStatus = status;
  }
  
  return await Tenant.find(query)
    .populate("ownerUserId", "name email username")
    .sort({ createdAt: -1 });
};

// --------------------------------------------------
// 6️⃣ Fetch Tenant By ID
// --------------------------------------------------
export const fetchTenantByIdService = async (tenantId) => {
  return await Tenant.findById(tenantId)
    .populate("ownerUserId", "name email username")
    .populate("verifiedBy", "name email");
};