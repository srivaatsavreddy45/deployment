const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['volunteer', 'admin', 'spoc'];
const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'];
const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    // Never returned by a normal query. Hashed by the pre-save hook below.
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    // Rotated refresh token. Never exposed to clients.
    refreshToken: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'volunteer',
    },
    // Mentor-mandated. Single source of truth for volunteer verification.
    // Only an authorized Admin may transition this field.
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'pending',
    },
    // Account lifecycle, distinct from verificationStatus.
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: stripSensitive },
    toObject: { virtuals: true, transform: stripSensitive },
  }
);

function stripSensitive(doc, ret) {
  delete ret.password;
  delete ret.refreshToken;
  return ret;
}

// Derived, never stored, so it cannot contradict verificationStatus.
userSchema.virtual('isVerified').get(function () {
  return this.verificationStatus === 'verified';
});

// Mongoose 9: an async pre-hook resolves on return; there is no `next` arg.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

User.ROLES = ROLES;
User.VERIFICATION_STATUSES = VERIFICATION_STATUSES;

module.exports = User;
