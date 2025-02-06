const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Schema } = mongoose;

const UserSchema = new Schema({
  // Authentication & Profile
  fullName: { type: String, required: true },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 5
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  emailVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  agreedToTerms: { type: Boolean, required: true },
  
  // Account Status
  isDisabled: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  
  // Security & Recovery
  recoveryQuestion: { type: String, required: true },
  recoveryAnswer: { type: String, required: true },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  
  // Wallet Information
  bitcoinWallet: { type: String },
  ethereumWallet: { type: String },
  usdtWallet: { type: String },
  walletAddress: { type: String },
  
  // Balances
  bitcoinAvailable: { type: Number, default: 0 },
  bitcoinPending: { type: Number, default: 0 },
  ethereumAvailable: { type: Number, default: 0 },
  ethereumPending: { type: Number, default: 0 },
  usdtAvailable: { type: Number, default: 0 },
  usdtPending: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  activeDeposit: { type: Number, default: 0 },
  pendingDeposit: { type: Number, default: 0 },
  totalWithdrawals: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  
  // Referral System
  referralLink: { type: String },
  upline: { type: String, default: 'N/A' },
  referrals: [{
    referredBy: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    commission: { type: Number, default: 0 }
  }],
  
  // Investment Related
  profileRate: { type: String, default: '' },
  investments: [{
    type: Schema.Types.ObjectId,
    ref: 'Investment'
  }],
  
  // Location Tracking
  location: {
    ip: { type: String },
    country: { type: String },
    city: { type: String },
  },

  // Add these references for population
  referredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  transactions: [{
    type: Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Middleware to recalculate pendingBalance
UserSchema.pre('save', function (next) {
  this.pendingBalance =
    this.bitcoinPending + this.ethereumPending + this.usdtPending;
  next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
