/**
 * Investment utility functions for calculating profits, ROI, and validating investments
 */

const INVESTMENT_PLANS = {
  STARTER: {
    name: 'Starter',
    minAmount: 100,
    maxAmount: 1000,
    dailyProfit: 0.5, // 0.5%
    duration: 30 // days
  },
  ADVANCED: {
    name: 'Advanced',
    minAmount: 1001,
    maxAmount: 5000,
    dailyProfit: 1.0, // 1%
    duration: 30
  },
  PREMIUM: {
    name: 'Premium',
    minAmount: 5001,
    maxAmount: 50000,
    dailyProfit: 1.5, // 1.5%
    duration: 30
  }
};

function calculateProfit(amount, selectedPackage) {
  const plan = INVESTMENT_PLANS[selectedPackage.toUpperCase()];
  if (!plan) throw new Error('Invalid investment package');

  const dailyProfit = (amount * plan.dailyProfit) / 100;
  const totalProfit = dailyProfit * plan.duration;
  
  return {
    dailyProfit,
    totalProfit,
    duration: plan.duration
  };
}

function validateInvestment(amount, selectedPackage) {
  const plan = INVESTMENT_PLANS[selectedPackage.toUpperCase()];
  if (!plan) {
    return {
      isValid: false,
      message: 'Invalid investment package selected'
    };
  }

  if (amount < plan.minAmount || amount > plan.maxAmount) {
    return {
      isValid: false,
      message: `Amount must be between ${plan.minAmount} and ${plan.maxAmount} for ${plan.name} package`
    };
  }

  return {
    isValid: true,
    plan
  };
}

function calculateROI(initialAmount, currentAmount) {
  return ((currentAmount - initialAmount) / initialAmount) * 100;
}

function getInvestmentPlans() {
  return Object.values(INVESTMENT_PLANS);
}

function calculateExpiryDate(startDate, packageName) {
  const plan = INVESTMENT_PLANS[packageName.toUpperCase()];
  if (!plan) throw new Error('Invalid investment package');

  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + plan.duration);
  return expiryDate;
}

module.exports = {
  INVESTMENT_PLANS,
  calculateProfit,
  validateInvestment,
  calculateROI,
  getInvestmentPlans,
  calculateExpiryDate
}; 