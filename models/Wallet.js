const mongoose = require('mongoose');
const { Schema } = mongoose;

const WalletSchema = new Schema({
  currency: {
    type: String,
    enum: ['bitcoin', 'ethereum', 'usdt'],
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  label: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Add indexes
WalletSchema.index({ currency: 1 });
WalletSchema.index({ isActive: 1 });

module.exports = mongoose.model('Wallet', WalletSchema); 