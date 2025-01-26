const mongoose = require('mongoose');
const { Schema } = mongoose;

const InvestmentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  selectedPackage: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bitcoin', 'ethereum', 'usdt']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'cancelled'],
    default: 'pending'
  },
  profit: {
    type: Number,
    default: 0
  },
  isProfitAdded: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  lastProfitUpdate: {
    type: Date
  },
  transactionHash: {
    type: String
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

// Add indexes for frequent queries
InvestmentSchema.index({ userId: 1, status: 1 });
InvestmentSchema.index({ createdAt: -1 });

// Add methods to calculate investment metrics
InvestmentSchema.methods.calculateROI = function() {
  return ((this.profit - this.amount) / this.amount) * 100;
};

InvestmentSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Add static methods for common queries
InvestmentSchema.statics.getActiveInvestments = function(userId) {
  return this.find({
    userId,
    status: 'approved',
    expiresAt: { $gt: new Date() }
  });
};

InvestmentSchema.statics.getTotalInvested = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
};

module.exports = mongoose.model('Investment', InvestmentSchema); 