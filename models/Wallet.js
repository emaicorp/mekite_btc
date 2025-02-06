const mongoose = require('mongoose');
const { Schema } = mongoose;

const WalletSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'BTC', 'ETH', 'USDT'],
    default: 'USD'
  },
  addresses: {
    bitcoin: {
      type: String,
      trim: true
    },
    ethereum: {
      type: String,
      trim: true
    },
    usdt: {
      type: String,
      trim: true
    }
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lastTransactionDate: {
    type: Date
  },
  dailyWithdrawalLimit: {
    type: Number,
    default: 10000
  },
  dailyWithdrawalUsed: {
    type: Number,
    default: 0
  },
  lastWithdrawalReset: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
WalletSchema.index({ userId: 1 }, { unique: true });
WalletSchema.index({ currency: 1 });
WalletSchema.index({ isLocked: 1 });

// Reset daily withdrawal limit
WalletSchema.methods.resetDailyWithdrawal = function() {
  const now = new Date();
  const lastReset = this.lastWithdrawalReset;
  
  if (now.getDate() !== lastReset.getDate() || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    this.dailyWithdrawalUsed = 0;
    this.lastWithdrawalReset = now;
  }
};

// Check if withdrawal is allowed
WalletSchema.methods.canWithdraw = function(amount) {
  this.resetDailyWithdrawal();
  return !this.isLocked && 
         this.balance >= amount && 
         (this.dailyWithdrawalUsed + amount) <= this.dailyWithdrawalLimit;
};

// Update balance
WalletSchema.methods.updateBalance = async function(amount, type) {
  if (type === 'debit' && this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  this.balance = type === 'credit' 
    ? this.balance + amount 
    : this.balance - amount;
  
  this.lastTransactionDate = new Date();
  
  if (type === 'debit') {
    this.dailyWithdrawalUsed += amount;
  }
  
  await this.save();
  return this;
};

// Create wallet for new user
WalletSchema.statics.createForUser = async function(userId) {
  try {
    const wallet = new this({
      userId,
      balance: 0,
      currency: 'USD'
    });
    await wallet.save();
    return wallet;
  } catch (error) {
    throw new Error(`Error creating wallet: ${error.message}`);
  }
};

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = Wallet; 