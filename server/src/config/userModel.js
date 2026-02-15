// config/userModel.js
// --------------------
// User model
//
// Purpose (module-level):
// - Store user credentials & security metadata used by the auth system.
// - Keep only minimal account-level fields for MVP (no admin roles).
// - Provide helper methods for password hashing and reset tokens.
//
// Notes for other devs:
// - Username examples: valid => "alice", "bob123", "john_doe", "jane.doe-1"
//   invalid => "A!i" (special chars removed by generator), "ab" (too short).
// - Email validated with validator.isEmail for readable errors.
// - Sensitive fields (password_hash, reset tokens, lock fields) are select:false
//   and removed from JSON via toJSON method.
//


import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import validator from 'validator';

const SALT_ROUNDS = 12;


const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 100, default: '' },

  /**
   * username
   *  - must be unique, lowercase, 3-30 chars
   *  - accepted chars: a-z, 0-9, dot, underscore, hyphen
   *  - Examples:
   *    valid:  "alice", "bob123", "john_doe", "jane.doe-1"
   *    invalid:"Jo" (too short), "some@name" (invalid char)
   */

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

  /**
 * email
 *  - must be a valid email format (user@domain.tld)
 *  - must be unique
 *  - automatically stored in lowercase
 *  - accepted:
 *      - letters (a-z)
 *      - numbers (0-9)
 *      - special chars: ., _, %, +, -
 *      - exactly one "@" symbol
 *      - valid domain and extension required
 *  - Examples:
 *    valid:   "alice@gmail.com", "bob123@outlook.com", "john.doe@mail.co"
 *    invalid: "plainaddress" (missing @ and domain)
 *             "user@.com" (invalid domain)
 *             "user@com" (missing extension)
 *             "user@@mail.com" (multiple @)
 */

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => validator.isEmail(v),
      message: 'Please enter a valid email address' // Refer Username!
    }
  },

  password_hash: { type: String, required: true, select: false },

  profile_avatar: { type: String, default: '' },

  reset_token: { type: String, select: false },
  reset_token_expiry: { type: Date, select: false },

  // Useful security metadata for lockouts / rate-limiting
  last_login: { type: Date, default: null },
  failed_login_attempts: { type: Number, default: 0, select: false },
  locked_until: { type: Date, select: false },
  lockout_level: { type: Number, default: 0, select: false }
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Module-level: password handling
 * - Virtual `password` allows controllers to assign plain text before save.
 * - Pre-validate hook hashes password if provided.
 * - comparePassword is available to controllers for auth checks.
 * - createResetToken sets hashed reset_token/reset_token_expiry and returns raw token for email.
 * - toJSON: strip sensitive fields automatically
 */

userSchema.virtual('password')
  .set(function (password) {
    this._password = password;
  });

  userSchema.pre("validate", async function () {
    if (this._password) {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      this.password_hash = await bcrypt.hash(this._password, salt);
    }
  });
  

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password_hash);
};


userSchema.methods.createResetToken = function (expiryMs = 60 * 60 * 1000) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.reset_token = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.reset_token_expiry = Date.now() + expiryMs;
  return rawToken;
};


userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.reset_token;
  delete obj.reset_token_expiry;
  delete obj.locked_until;
  return obj;
};

export const User = mongoose.model('User', userSchema);
