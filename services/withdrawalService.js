const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const EmailService = require('./emailService');

class WithdrawalService {
  static async createWithdrawal(userId, withdrawalData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.availableBalance < withdrawalData.amount) {
        throw new Error('Insufficient balance');
      }

      // Create withdrawal request
      const withdrawal = await Withdrawal.create({
        userId,
        amount: withdrawalData.amount,
        currency: withdrawalData.currency,
        walletAddress: withdrawalData.walletAddress
      });

      // Send email notification
      await EmailService.sendWithdrawalRequestNotification(user, withdrawal);

      return withdrawal;
    } catch (error) {
      throw new Error(`Error creating withdrawal: ${error.message}`);
    }
  }

  static async updateWithdrawalStatus(withdrawalId, status, remarks) {
    try {
      const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('userId', 'email username fullName availableBalance');

      if (!withdrawal) {
        throw new Error('Withdrawal not found');
      }

      if (withdrawal.status !== 'pending') {
        throw new Error('Withdrawal has already been processed');
      }

      withdrawal.status = status;
      withdrawal.remarks = remarks || '';
      withdrawal.processedAt = new Date();

      if (status === 'approved') {
        // Deduct from user's available balance
        const user = withdrawal.userId;
        if (user.availableBalance < withdrawal.amount) {
          throw new Error('Insufficient balance');
        }
        
        user.availableBalance -= withdrawal.amount;
        user.totalWithdrawals = withdrawal.amount;
        await user.save();
      }

      await withdrawal.save();

      // Send email notification based on status
      if (status === 'approved') {
        await EmailService.sendWithdrawalApprovalNotification(withdrawal.userId, withdrawal);
      } else if (status === 'rejected') {
        await EmailService.sendWithdrawalRejectionNotification(withdrawal.userId, withdrawal);
      }

      return withdrawal;
    } catch (error) {
      throw new Error(`Error updating withdrawal: ${error.message}`);
    }
  }

  static async getUserWithdrawals(userId) {
    try {
      return await Withdrawal.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching withdrawals: ${error.message}`);
    }
  }

  static async getAllWithdrawals() {
    try {
      return await Withdrawal.find()
        .populate('userId', 'username email')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching all withdrawals: ${error.message}`);
    }
  }

  static async getUserWithdrawal(withdrawalId, userId) {
    try {
      return await Withdrawal.findOne({ _id: withdrawalId, userId });
    } catch (error) {
      throw new Error(`Error fetching withdrawal: ${error.message}`);
    }
  }

  static async deleteWithdrawal(withdrawalId) {
    try {
      await Withdrawal.findByIdAndDelete(withdrawalId);
    } catch (error) {
      throw new Error(`Error deleting withdrawal: ${error.message}`);
    }
  }
}

module.exports = WithdrawalService; 