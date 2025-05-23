const User = require('../models/User');
const Investment = require('../models/Investment');
const { calculateProfit } = require('../utils/investmentUtils');
const InvestmentPlan = require('../models/InvestmentPlan')
const emailService = require('../services/emailService')

class InvestmentService {
  static async validateInvestment(selectedPackage, paymentMethod, amount) {
    try {
      // Add your investment validation logic here
      const selectedPackages = await InvestmentPlan.findOne({name : selectedPackage})
      console.log(selectedPackages)

      if (amount < selectedPackages.minAmount || amount > selectedPackages.maxAmount) {
        return {
          isValid: false,
          message: `Investment amount must be between ${selectedPackages.minAmount} and ${selectedPackages.maxAmount}`
        };
      }

      return { isValid: true };
    } catch (error) {
      throw new Error(`Investment validation error: ${error.message}`);
    }
  }

  static async deducBalance(userId, amount) {
    try {
      console.log("ammount", amount)
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      if (user.availableBalance < amount) {
        throw new Error('Insufficient balance');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { availableBalance: user.availableBalance - amount } },
        { new: true }
      );
      console.log("updatedUser", updatedUser)
      return updatedUser;
    } catch (error) {
      throw new Error(`Error deducting balance: ${error.message}`);
    }
  }

  static async createInvestment(userId, selectedPackage, paymentMethod, amount) {
    try {
      const user = await User.findById(userId).select('investments');
      const selectedPackages = await InvestmentPlan.findOne({name : selectedPackage})

      if (!user) throw new Error('User not found');
      if (!selectedPackages) throw new Error('Package Not Found')
        const createdAt = new Date();
const expiresAt = new Date(createdAt);
expiresAt.setDate(createdAt.getDate() + selectedPackages.duration);
      const investment = new Investment({
        userId,
        selectedPackage,
        paymentMethod,
        amount,
        status: 'pending',
        createdAt: createdAt,
        expiresAt: expiresAt 
      });

      await investment.save();

      // Update user's investments array without triggering full validation
      await User.findByIdAndUpdate(
        userId,
        { $push: { investments: investment._id } },
        { new: true, runValidators: false }
      );

      return investment;
    } catch (error) {
      throw new Error(`Error creating investment: ${error.message}`);
    }
  }

  static async getUserInvestments(userId) {
    try {
      const investments = await Investment.find({ userId })
        .sort({ createdAt: -1 });
      return investments;
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

      const profit = await calculateProfit(investment.amount, investment.selectedPackage);
      user.totalEarnings += profit.dailyProfit;
      await user.save();

      return { user, profit: profit.dailyProfit };
    } catch (error) {
      console.log("error", error);
      throw new Error(`Error calculating profit: ${error.message}`);
    }
  }
}

module.exports = InvestmentService; 