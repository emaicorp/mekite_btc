const mongoose = require('mongoose');
const { Schema } = mongoose;

const InvestmentPlanSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  minAmount: {
    type: Number,
    required: true,
    min: 0
  },
  maxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  dailyProfit: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // Percentage
  },
  duration: {
    type: Number,
    required: true,
    min: 1 // Days
  },
  features: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add indexes
InvestmentPlanSchema.index({ status: 1, isDeleted: 1 });
InvestmentPlanSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('InvestmentPlan', InvestmentPlanSchema); 