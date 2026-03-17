import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import { UserInvitation } from './src/models/auth/userInvitation.model.js';
import { User } from './src/models/auth/user.model.js';
import Tenant from './src/models/tenant/tenant.model.js';

dotenv.config();

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- DATABASE DIAGNOSIS ---');

    const totalInvites = await UserInvitation.countDocuments();
    console.log('Total UserInvitations in system:', totalInvites);

    const pendingInvites = await UserInvitation.find({ accepted_at: null });
    console.log('Pending UserInvitations found:', pendingInvites.length);

    if (pendingInvites.length > 0) {
      console.log('\n--- DETAILED PENDING INVITES ---');
      pendingInvites.forEach(inv => {
        console.log(`Email: ${inv.email}, TenantID: ${inv.tenant_id}, Expires: ${inv.expires_at}`);
      });
    }

    const allUsers = await User.find({ platform_role: { $ne: 'super_admin' } }).limit(5);
    console.log('\n--- RECENT NON-SUPER-ADMIN USERS ---');
    allUsers.forEach(u => {
      console.log(`Name: ${u.name}, Email: ${u.email}, TenantID: ${u.tenant_id}, Role: ${u.tenant_role}`);
    });

    const allTenants = await Tenant.find({}).limit(5);
    console.log('\n--- TENANTS ---');
    allTenants.forEach(t => {
      console.log(`Name: ${t.name}, ID: ${t._id}`);
    });

  } catch (err) {
    console.error('Diagnosis Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

diagnose().catch(console.error);
