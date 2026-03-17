import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserInvitation } from './src/models/auth/userInvitation.model.js';
import { User } from './src/models/auth/user.model.js';

dotenv.config();

async function checkInvites() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const allInvites = await UserInvitation.find({});
  console.log('Total invitations in DB:', allInvites.length);
  console.log('Invitations:', JSON.stringify(allInvites, null, 2));

  const allUsers = await User.find({}).select('name email tenant_id tenant_role');
  console.log('Users:', JSON.stringify(allUsers, null, 2));

  await mongoose.disconnect();
}

checkInvites().catch(console.error);
