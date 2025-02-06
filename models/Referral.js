const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReferralSchema = new Schema({
  referrerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referredId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  commission: {
    type: Number,
    default: 0
  },
  commissionPaid: {
    type: Boolean,
    default: false
  },
  level: {
    type: Number,
    required: true,
    default: 1
  },
  totalInvestment: {
    type: Number,
    default: 0
  },
  lastInvestmentDate: {
    type: Date
  },
  activationDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ referredId: 1 }, { unique: true });
ReferralSchema.index({ createdAt: -1 });

// Calculate commission based on investment amount and level
ReferralSchema.methods.calculateCommission = async function(investmentAmount) {
  const ReferralCommission = mongoose.model('ReferralCommission');
  const commission = await ReferralCommission.findOne({ level: this.level });
  
  if (!commission) return 0;
  
  const commissionAmount = (investmentAmount * commission.percentage) / 100;
  this.commission += commissionAmount;
  this.totalInvestment += investmentAmount;
  this.lastInvestmentDate = new Date();
  
  if (this.status === 'pending' && this.totalInvestment >= commission.minInvestment) {
    this.status = 'active';
    this.activationDate = new Date();
  }
  
  await this.save();
  return commissionAmount;
};

// Get referral chain (upline)
ReferralSchema.statics.getReferralChain = async function(userId, maxLevel = 3) {
  const chain = [];
  let currentUserId = userId;
  
  for (let i = 0; i < maxLevel; i++) {
    const referral = await this.findOne({ referredId: currentUserId })
      .populate('referrerId', 'username email');
    
    if (!referral) break;
    
    chain.push({
      level: i + 1,
      user: referral.referrerId
    });
    
    currentUserId = referral.referrerId._id;
  }
  
  return chain;
};

const Referral = mongoose.model('Referral', ReferralSchema);

module.exports = Referral; 