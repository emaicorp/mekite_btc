const mongoose = require('mongoose');
const { Schema } = mongoose;

// Investment Schema
const InvestmentSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  investmentPlan: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

// Investment model
const Investment = mongoose.model('Investment', InvestmentSchema);
module.exports = Investment;
