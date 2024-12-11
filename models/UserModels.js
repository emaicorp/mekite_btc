const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // User Information
  fullname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  role: { type: String, enum: ["user", "admin"], default: "user" }, // Differentiates between admin and regular user

  // Wallets
  wallets: {
    usdt: { type: String, required: true }, // TRC20 Account ID
    ethereum: { type: String, required: true },
    bitcoin: { type: String, required: true },
  },

  // Security
  security: {
    secretQuestion: { type: String, required: true },
    secretAnswer: { type: String, required: true },
  },
  
  agree: { type: Boolean, required: true }, // Terms and conditions agreement

  // Profile Customization
  profile: {
    avatar: { type: String }, // URL to profile picture
    bio: { type: String },
    phoneNumber: { type: String }, // Optional
    country: { type: String }, // Optional
  },

  // Two-Factor Authentication (2FA)
  twoFactorAuth: {
    isEnabled: { type: Boolean, default: false },
    method: { type: String, enum: ["email", "sms", "authenticator"], default: "email" },
    secret: { type: String },
  },

  // Referral Information
  referral: {
    referralLink: { type: String, required: true },
    totalReferrals: { type: Number, default: 0 },
    activeReferrals: { type: Number, default: 0 },
    referralBonuses: [
      {
        referralId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        bonusAmount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },

  // Financial Information
  balance: {
    activeBalance: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalBalance: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
  },
  transactionLimits: {
    dailyLimit: { type: Number, default: 1000 },
    monthlyLimit: { type: Number, default: 10000 },
  },

  // Investment Plans
  plans: [
    {
      chosenPlan: { type: String, required: true }, // E.g., "Basic", "Premium"
      amount: { type: Number, required: true },
      paymentMethod: { type: String, enum: ["usdt", "ethereum", "bitcoin"], required: true },
      status: { type: String, enum: ["pending", "active", "completed"], default: "pending" },
      date: { type: Date, default: Date.now },
    },
  ],

  // Withdrawals
  withdrawals: [
    {
      amount: { type: Number, required: true },
      method: { type: String, enum: ["usdt", "ethereum", "bitcoin"], required: true },
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    },
  ],

  // Transaction History
  history: [
    {
      type: { type: String, enum: ["deposit", "withdrawal", "earning"], required: true },
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      description: { type: String },
    },
  ],

  // Latest Activity
  latestActivity: { type: Date, default: Date.now },

  // User Verification
  verificationStatus: {
    emailVerified: { type: Boolean, default: false },
    kycVerified: { type: Boolean, default: false },
    documents: [
      {
        documentType: { type: String, enum: ["ID", "Passport", "Driver's License"] },
        documentUrl: { type: String },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      },
    ],
  },
  
  // Notifications
  notifications: [
    {
      message: { type: String, required: true },
      type: { type: String, enum: ["info", "warning", "alert"], default: "info" },
      read: { type: Boolean, default: false },
      timestamp: { type: Date, default: Date.now },
    },
  ],

  // Audit Logs
  auditLogs: [
    {
      action: { type: String, required: true }, // E.g., "Login", "Withdrawal"
      ip: { type: String }, // IP address
      location: { type: String }, // Derived from IP
      timestamp: { type: Date, default: Date.now },
    },
  ],

  // Support Tickets
  supportTickets: [
    {
      subject: { type: String, required: true },
      message: { type: String, required: true },
      status: { type: String, enum: ["open", "in-progress", "resolved"], default: "open" },
      timestamp: { type: Date, default: Date.now },
    },
  ],

  // Preferences
  preferences: {
    language: { type: String, default: "en" },
    currency: { type: String, default: "USD" },
    notificationSettings: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
  },

  "createdAt" : "Date",
  "updatedAt": "Date",
  "isActive" : "Boolean",
  "isVerified" : "Boolean",
  "isSuspended": "Boolean",
  "SuspensionReason": "String"
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
