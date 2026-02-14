// config/userModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import validator from 'validator'; // npm i validator

const SALT_ROUNDS = 12;

/**
 * User model notes
 * - globalRole: account-level permission (rarely changed).
 * - defaultMeetingRole: optional preference set explicitly by admin/host to persist meeting role across meetings.
 * - password_hash & token fields are select:false (never returned in normal queries).
 */
const userSchema = new mongoose.Schema({
  displayName: { type: String, trim: true, maxlength: 100, default: '' },

  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-z0-9._-]+$/, 'Invalid username']
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => validator.isEmail(v),
      message: 'Please enter a valid email address'
    }
  },

  password_hash: { type: String, required: true, select: false },

  profile_avatar: { type: String, default: '' },

  // account-level role (do not use for meeting-level permissions)
  globalRole: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  /**
   * Optional: if host chooses to persist a user's elevated meeting role across meetings,
   * set this explicitly via an admin/host endpoint. It is NOT modified automatically by in-meeting promotions.
   */
  defaultMeetingRole: {
    type: String,
    enum: ['host', 'editor', 'user'],
    default: 'user'
  },

  // tokens (hashed) - select:false so not returned in normal reads
  reset_token: { type: String, select: false },
  reset_token_expiry: { type: Date, select: false },

  last_login: { type: Date, default: null },
  failed_login_attempts: { type: Number, default: 0 },
  locked_until: { type: Date, select: false }
}, {
  timestamps: true,
  versionKey: false
});

/* ----------------------
   Password handling
   - Virtual setter `password` lets controllers set user.password = 'plain' before save.
   - Pre-save hook will hash when password is present.
   ---------------------- */
userSchema.virtual('password')
  .set(function(password) {
    this._password = password;
  });

userSchema.pre('save', async function(next) {
  // Only hash if plain password was set (useful for update cases)
  if (this._password) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password_hash = await bcrypt.hash(this._password, salt);
  }
  next();
});

// Compare plaintext password with stored hash
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password_hash);
};

// Create a hashed reset token, store it to DB, and return the raw token for email
userSchema.methods.createResetToken = function(expiryMs = 60 * 60 * 1000) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.reset_token = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.reset_token_expiry = Date.now() + expiryMs;
  return rawToken;
};

// toJSON: strip sensitive fields automatically
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.reset_token;
  delete obj.reset_token_expiry;
  delete obj.locked_until;
  return obj;
};

export const User = mongoose.model('User', userSchema);
