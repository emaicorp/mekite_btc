const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  // Authentication & Profile
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
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
    selectedPackage: String,
    paymentMethod: String,
    amount: Number,
    status: { type: String, enum: ['pending', 'approved', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    isProfitAdded: { type: Boolean, default: false },
  }],
  
  // Location Tracking
  location: {
    ip: { type: String },
    country: { type: String },
    city: { type: String },
  }
});

// Middleware to recalculate pendingBalance
UserSchema.pre('save', function (next) {
  this.pendingBalance =
    this.bitcoinPending + this.ethereumPending + this.usdtPending;
  next();
});

module.exports = mongoose.model('User', UserSchema);
