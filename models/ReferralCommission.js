const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReferralCommissionSchema = new Schema({
  level: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  minInvestment: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ReferralCommissionSchema.index({ level: 1 }, { unique: true });
ReferralCommissionSchema.index({ isActive: 1 });

// Default commission structure
ReferralCommissionSchema.statics.createDefaultStructure = async function() {
  const defaults = [
    { level: 1, percentage: 10, minInvestment: 100, description: 'Direct Referral' },
    { level: 2, percentage: 5, minInvestment: 100, description: 'Second Level' },
    { level: 3, percentage: 2, minInvestment: 100, description: 'Third Level' }
  ];

  try {
    await this.deleteMany({}); // Clear existing structure
    return await this.insertMany(defaults);
  } catch (error) {
    throw new Error(`Error creating default commission structure: ${error.message}`);
  }
};

// Validate commission percentages
ReferralCommissionSchema.pre('save', function(next) {
  if (this.percentage < 0 || this.percentage > 100) {
    next(new Error('Commission percentage must be between 0 and 100'));
  }
  next();
});

const ReferralCommission = mongoose.model('ReferralCommission', ReferralCommissionSchema);

module.exports = ReferralCommission; 