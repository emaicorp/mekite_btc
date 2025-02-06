/**
 * Investment utility functions for calculating profits, ROI, and validating investments
 */

const InvestmentPlan = require('../models/InvestmentPlan');



const calculateProfit = async (amount, selectedPackage) => {
  console.log(selectedPackage);
  const plan = await InvestmentPlan.findOne({ name: selectedPackage });
  
  if (!plan) {
    throw new Error(`Invalid investment package: ${selectedPackage}`);
  }

  const dailyProfit = (amount * plan.dailyProfit) / 100;
  const totalProfit = dailyProfit * plan.duration;
  
  return {
    dailyProfit,
    totalProfit,
    duration: plan.duration
  };
};

const validateInvestment = async (amount, selectedPackage) => {
  const plan = await InvestmentPlan.findOne({ name: selectedPackage });
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
};

const calculateROI = (initialAmount, currentAmount) => {
  return ((currentAmount - initialAmount) / initialAmount) * 100;
};

const getInvestmentPlans = async () => {
  return await InvestmentPlan.find().sort({ minAmount: 1 });
};

const calculateExpiryDate = async (startDate, packageName) => {
  const plan = await InvestmentPlan.findOne({ name: packageName });
  if (!plan) throw new Error('Invalid investment package');

  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + plan.duration);
  return expiryDate;
};

module.exports = {
  calculateProfit,
  validateInvestment,
  calculateROI,
  getInvestmentPlans,
  calculateExpiryDate
}; 