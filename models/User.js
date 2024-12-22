const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  recoveryQuestion: { type: String, required: true },
  recoveryAnswer: { type: String, required: true },
  bitcoinWallet: { type: String },
  ethereumWallet: { type: String },
  usdtWallet: { type: String },
  referralLink: { type: String },
  walletAddress: { type: String },
  resetToken: { type: String },
resetTokenExpiry: { type: Date },
  upline: { type: String, default: 'N/A' },
  agreedToTerms: { type: Boolean, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

   // Fields for tracking balances for each currency
   bitcoinAvailable: { type: Number, default: 0 },
   bitcoinPending: { type: Number, default: 0 },
   ethereumAvailable: { type: Number, default: 0 },
   ethereumPending: { type: Number, default: 0 },
   usdtAvailable: { type: Number, default: 0 },
   usdtPending: { type: Number, default: 0 },

   referrals: [
    {
      referredBy: { type: String }, // Referrer's username or unique identifier
      status: { type: String, enum: ['active', 'inactive'], default: 'inactive' }, // Status of the referral
      commission: { type: Number, default: 0 } // Commission earned from this referral
    }
  ],

  // New field for tracking total withdrawals
  totalWithdrawals: { type: Number, default: 0 },  // Total withdrawals (type: Number)

   // New field for overall available balance (sum of all available balances)
   availableBalance: { type: Number, default: 0 }, // This will store the sum of bitcoinAvailable, ethereumAvailable, and usdtAvailable

   totalEarnings: { type: Number, default: 0 },  // Total earnings (type: Number)

    // Fields for tracking user's last seen and online status
  lastSeen: { type: Date, default: Date.now }, // Timestamp for the last time the user was online
  isOnline: { type: Boolean, default: false },  // Boolean to indicate if the user is currently online

   // New field for tracking user location
   location: {
    ip: { type: String },
    country: { type: String },
    city: { type: String },
  },

  // New field for tracking investments
  investments: [
    {
      selectedPackage: { type: String, required: true }, // Package selected by the user
      paymentMethod: { type: String, enum: ['bitcoin', 'usdt', 'ethereum'], required: true },
      amount: { type: Number, required: true },
      status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
      dateInvested: { type: Date, default: Date.now }
    }
  ],

  emailVerified: { type: Boolean, default: false },
isDisabled: { type: Boolean, default: false },
isSuspended: { type: Boolean, default: false },

});

module.exports = mongoose.model('User', UserSchema);
