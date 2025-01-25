const User = require('../models/User');
const Investment = require('../models/Investment');
const { calculateProfit } = require('../utils/investmentUtils');

class InvestmentService {
  static async validateInvestment(selectedPackage, paymentMethod, amount) {
    try {
      // Add your investment validation logic here
      const minAmount = 100; // Example minimum amount
      const maxAmount = 1000000; // Example maximum amount

      if (amount < minAmount || amount > maxAmount) {
        return {
          isValid: false,
          message: `Investment amount must be between ${minAmount} and ${maxAmount}`
        };
      }

      return { isValid: true };
    } catch (error) {
      throw new Error(`Investment validation error: ${error.message}`);
    }
  }

  static async createInvestment(userId, selectedPackage, paymentMethod, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const investment = new Investment({
        userId,
        selectedPackage,
        paymentMethod,
        amount,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      await investment.save();
      user.investments.push(investment);
      await user.save();

      return investment;
    } catch (error) {
      throw new Error(`Error creating investment: ${error.message}`);
    }
  }

  static async getUserInvestments(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      return user.investments;
    } catch (error) {
      throw new Error(`Error fetching investments: ${error.message}`);
    }
  }

  static async getInvestmentPlans() {
    try {
      // Add your investment plans logic here
      return [
        {
          name: 'Starter',
          minAmount: 100,
          maxAmount: 1000,
          duration: 30,
          dailyProfit: 0.5
        },
        {
          name: 'Advanced',
          minAmount: 1001,
          maxAmount: 5000,
          duration: 30,
          dailyProfit: 1
        },
        {
          name: 'Premium',
          minAmount: 5001,
          maxAmount: 1000000,
          duration: 30,
          dailyProfit: 1.5
        }
      ];
    } catch (error) {
      throw new Error(`Error fetching investment plans: ${error.message}`);
    }
  }

  static async updateStatus(investmentId, status) {
    try {
      const investment = await Investment.findById(investmentId);
      if (!investment) throw new Error('Investment not found');

      investment.status = status;
      await investment.save();

      return investment;
    } catch (error) {
      throw new Error(`Error updating investment status: ${error.message}`);
    }
  }

  static async initiateProfitCalculation(investment) {
    try {
      const user = await User.findById(investment.userId);
      if (!user) throw new Error('User not found');

      const profit = calculateProfit(investment.amount, investment.selectedPackage);
      user.totalEarnings += profit;
      await user.save();

      return { user, profit };
    } catch (error) {
      throw new Error(`Error calculating profit: ${error.message}`);
    }
  }
}

module.exports = InvestmentService; 