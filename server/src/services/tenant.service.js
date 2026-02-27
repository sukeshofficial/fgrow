import Tenant from "../models/tenant.model.js";
import Plan from "../models/plan.model.js";
import TenantSubscription from "../models/tenantSubscription.model.js";
import { User } from "../models/user.model.js";
import slugify from "slugify";

export const createTenantService = async (data) => {
  const {
    companyName,
    companyEmail,
    companyPhone,
    ownerName,
    username,
    email,
    password,
  } = data;

  // 1️⃣ Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  // 2️⃣ Get Free plan
  const plan = await Plan.findOne({ name: "Free", isActive: true });
  if (!plan) {
    throw new Error("Default plan not found");
  }

  // 3️⃣ Create Tenant
  const tenant = await Tenant.create({
    name: companyName,
    companyEmail,
    companyPhone,
    domain: slugify(companyName, { lower: true }),
  });

  // 4️⃣ Create Owner User
  const user = new User({
    name: ownerName,
    username,
    email,
    tenant: tenant._id,
    role: "owner",
    status: "active",
  });

  user.password = password;
  await user.save();

  // 5️⃣ Create Subscription (14-day trial)
  await TenantSubscription.create({
    tenant: tenant._id,
    plan: plan._id,
    status: "trial",
    startDate: new Date(),
    trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  // 6️⃣ Attach owner to tenant
  tenant.ownerUserId = user._id;
  await tenant.save();

  return { tenant, user };
};
