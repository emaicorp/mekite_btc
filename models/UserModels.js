const mongoose = require('mongoose');
const { Schema } = mongoose;

const DepositSchema = new Schema({
  amount: { type: Number, required: true },
  currency: { type: String, required: true, enum: ['usdt', 'ethereum', 'bitcoin'] },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const WithdrawalSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
});

// Schema for user activity
const ActivitySchema = new Schema({
  action: { type: String, required: true }, // Description of the activity
  timestamp: { type: Date, default: Date.now }, // Time of the activity
});

const InvestmentSchema = new mongoose.Schema({
  investmentPlan: { type: String, required: true, enum: ['STARTER', 'CRYPTO PLAN', 'ADVANCED PLAN', 'PAY PLAN', 'PREMIUM PLAN'] },
  paymentMethod: { type: String, required: true, enum: ['USDT', 'Ethereum', 'Bitcoin'] },
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['usdt', 'ethereum', 'bitcoin'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, 
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new Schema({
  fullname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  wallets: {
    usdt: { type: String },
    ethereum: { type: String },
    bitcoin: { type: String },
  },
  security: {
    secretQuestion: { type: String, required: true },
    secretAnswer: { type: String, required: true },
  },
  referralLink: { type: String, unique: true },
  walletAddress: { type: String, unique: true },

  balance: {
    usdt: { type: Number, default: 0 },
    ethereum: { type: Number, default: 0 },
    bitcoin: { type: Number, default: 0 },
  },
  roles: { type: [String], default: ['user'] }, // Change `role` to `roles` and make it an array

  deposits: [DepositSchema], // New deposits field to track user deposits
  withdrawals: [WithdrawalSchema], // New field to track withdrawals
  investments: [InvestmentSchema], // Add investments array to track user investments

    activities: { type: [ActivitySchema], default: [] }, // Define and initialize

  totalEarnings: { type: Number, default: 0 }, // Track total earnings

location: {
    ip: String,
    city: String,
    country: String,
  },
  lastOnline: Date,
    isOnline: { type: Boolean, default: false }
}, { timestamps: true });

UserSchema.pre('save', function (next) {
  if (this.isNew) {
    // Generate referral link
    this.referralLink = `https://endearing-chaja-8b54ac.netlify.app/referral/${this.username}`;
    
    // Generate a 32-character alphanumeric wallet address
    this.walletAddress = Array(4)
      .fill(0)
      .map(() => Math.random().toString(36).substr(2, 8))
      .join(''); // Generates 4 * 8 = 32 characters
  }
  next();
});


// Method to get user balances
UserSchema.methods.getBalance = function () {
  return {
    usdt: this.balance.usdt,
    ethereum: this.balance.ethereum,
    bitcoin: this.balance.bitcoin,
  };
};

UserSchema.methods.getDashboardMessage = function () {
  if (!Array.isArray(this.roles)) {
    return 'Unable to determine dashboard access. Please contact support.';
  }
  if (this.roles.includes('admin')) {
    return 'Welcome Admin! You have access to the Admin Dashboard.';
  }
  return 'Welcome User! You have access to the User Dashboard.';
};


// Method to update user balances
UserSchema.methods.updateBalance = function (currency, amount) {
  if (this.balance[currency] !== undefined) {
    this.balance[currency] += amount;
    return this.save();
  } else {
    throw new Error(`Unsupported currency: ${currency}`);
  }
};

// Method to get active deposits
UserSchema.methods.getActiveDeposits = function () {
  return this.deposits.filter(deposit => deposit.status === 'active');
};

// Method to add earnings to the total
UserSchema.methods.addEarnings = function (amount) {
  this.totalEarnings += amount;
  return this.save();
};

// Method to get total earnings
UserSchema.methods.getTotalEarnings = function () {
  return this.totalEarnings;
};

// Method to add an activity
UserSchema.methods.addActivity = function (action) {
  this.activities.unshift({ action });
  return this.save();
};

// Method to get the latest activity
UserSchema.methods.getLatestActivity = function () {
  return this.activities.length > 0 ? this.activities[0] : null;
};

// Method to add a withdrawal request
UserSchema.methods.requestWithdrawal = function (currency, amount) {
  if (this.balance[currency] < amount) {
    throw new Error(`Insufficient ${currency} balance`);
  }

  // Create withdrawal request
  const withdrawal = new Withdrawal({
    amount,
    currency,
  });

  this.withdrawals.push(withdrawal); // Add to user's withdrawal history
  this.balance[currency] -= amount; // Deduct the amount from balance

  return this.save();
};

// Method to process a pending withdrawal
UserSchema.methods.processWithdrawal = function (withdrawalId, status) {
  const withdrawal = this.withdrawals.id(withdrawalId);

  if (!withdrawal) {
    throw new Error('Withdrawal not found');
  }

  withdrawal.status = status; // Update the withdrawal status to 'completed' or 'rejected'

  // If completed, update balance
  if (status === 'completed') {
    this.balance[withdrawal.currency] -= withdrawal.amount; // Deduct from balance
  } else if (status === 'rejected') {
    // If rejected, refund the amount back to the user balance
    this.balance[withdrawal.currency] += withdrawal.amount;
  }

  return this.save();
};


UserSchema.methods.addInvestment = async function (investmentPlan, amount, currency, paymentMethod) {
  // Create the investment object and set the status to 'pending' directly
  const newInvestment = new Investment({
    investmentPlan,
    paymentMethod,
    amount,  
    currency,
    status: 'pending', // Automatically set status to 'pending' without balance check
  });

  // Add the investment to the user's investments
  this.investments.push(newInvestment);

  // Save the updated user record
  await this.save();

  return newInvestment; // Return the new investment object
};


module.exports = mongoose.model('User', UserSchema);
