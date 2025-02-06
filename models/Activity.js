const mongoose = require('mongoose');
const { Schema } = mongoose;

const ActivitySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['login', 'investment', 'withdrawal', 'deposit', 'referral', 'profile_update', 'password_change'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'BTC', 'ETH', 'USDT'],
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed'],
    default: 'success'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ userId: 1, type: 1 });
ActivitySchema.index({ userId: 1, createdAt: -1 });

// Virtual for formatted date
ActivitySchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString();
});

// Method to create activity log
ActivitySchema.statics.logActivity = async function(data) {
  try {
    const activity = new this(data);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

// Method to get user's recent activities
ActivitySchema.statics.getRecentActivities = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

const Activity = mongoose.model('Activity', ActivitySchema);

module.exports = Activity; 