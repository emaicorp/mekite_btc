const mongoose = require('mongoose');
const { Schema } = mongoose;

const TransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'investment', 'referral', 'profit', 'referral_commission'],
    required: true
  },
  currency: {
    type: String,
    enum: ['bitcoin', 'ethereum', 'usdt','balance'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  walletAddress: {
    type: String,
    required: false
  },
  transactionHash: {
    type: String
  },
  description: {
    type: String
  },
  remarks: {
    type: String
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Add indexes for frequent queries
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

// Add static methods for common queries
TransactionSchema.statics.getPendingTransactions = function() {
  return this.find({ status: 'pending' }).populate('userId', 'username email');
};

TransactionSchema.statics.getUserTransactions = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

TransactionSchema.statics.getTotalTransactions = function(userId, type) {
  return this.aggregate([
    { 
      $match: { 
        userId: mongoose.Types.ObjectId(userId),
        type,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', TransactionSchema); 