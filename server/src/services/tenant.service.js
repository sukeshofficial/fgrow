import Tenant from "../models/tenant.model.js";
import Plan from "../models/plan.model.js";
import TenantSubscription from "../models/tenantSubscription.model.js";
import { User } from "../models/user.model.js";
import slugify from "slugify";

/*
export const createTenantService = async (data) => {
  const {
    companyName,
    companyEmail,
    companyPhone,
    email,
  } = data;

  // 1️⃣ Check if email already exists
  // const existingUser = await User.findOne({ email });
  // if (existingUser) {
  //   throw new Error("User already exists");
  // }

  // 2️⃣ Get Free plan
  // const plan = await Plan.findOne({ name: "Free", isActive: true });
  // if (!plan) {
  //   throw new Error("Default plan not found");
  // }

  // 3️⃣ Create Tenant
  const tenant = await Tenant.create({
    name: companyName,
    companyEmail,
    companyPhone,
    domain: slugify(companyName, { lower: true }),
  });

  // 1️⃣ Find existing user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User with this email does not exist");
  }

  // 2️⃣ Attach tenant to user
  user.tenant_id = tenant._id;
  user.role = "owner";
  user.status = "active";

  await user.save();

  // 5️⃣ Create Subscription (14-day trial)
  // await TenantSubscription.create({
  //   tenant: tenant._id,
  //   plan: plan._id,
  //   status: "trial",
  //   startDate: new Date(),
  //   trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  // });

  // 6️⃣ Attach owner to tenant
  tenant.ownerUserId = user._id;
  await tenant.save();

  return { tenant, user };
};
*/

export const createTenantService = async (data) => {
  const {
    companyName,
    companyEmail,
    companyPhone,
    email, // owner email
  } = data;

  // 1️⃣ Find existing user and Tenant if exists
  const user = await User.findOne({ email });
  const existingTenant = await Tenant.findOne({ companyEmail });

  if (!user) {
    throw new Error("User with this email does not exist");
  }

  // Optional safety check
  if (user.tenant_id) {
    throw new Error(`User already belongs to a tenant ${existingTenant.name}`);
  }

  // 2️⃣ Create tenant instance (NOT saved yet)
  const tenant = new Tenant({
    name: companyName,
    companyEmail,
    companyPhone,
    domain: slugify(companyName, { lower: true }),
  });

  // 3️⃣ Attach user to tenant
  user.tenant_id = tenant._id;
  user.role = "owner";
  user.status = "active";
  await user.save();

  // 4️⃣ Attach owner to tenant
  tenant.ownerUserId = user._id;

  // 5️⃣ Save tenant
  await tenant.save();

  return { tenant, user };
};
