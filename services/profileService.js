const User = require('../models/User');
const Transaction = require('../models/Transaction');

class ProfileService {
  static async validateEmailChange(newEmail) {
    try {
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser) {
        throw new Error('Email already in use');
      }
      return true;
    } catch (error) {
      throw new Error(`Email validation error: ${error.message}`);
    }
  }

  static async updateUserProfile(userId, updateData) {
    try {
      // Remove sensitive fields that shouldn't be updated directly
      const sanitizedData = { ...updateData };
      delete sanitizedData.password;
      delete sanitizedData.role;
      delete sanitizedData.totalEarnings;
      delete sanitizedData.availableBalance;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: sanitizedData },
        { new: true }
      ).select('-password');

      if (!user) throw new Error('User not found');

      return user;
    } catch (error) {
      throw new Error(`Error updating profile: ${error.message}`);
    }
  }

  static async getUserActivity(userId) {
    try {
      // Get recent transactions
      const transactions = await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10);

      // Get user's investment activity
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const recentInvestments = user.investments
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10);

      // Get login history (assuming you have a separate collection for this)
      // const loginHistory = await LoginHistory.find({ userId }).sort({ timestamp: -1 }).limit(5);

      return {
        transactions,
        investments: recentInvestments,
        // loginHistory,
        lastSeen: user.lastSeen,
        isOnline: user.isOnline
      };
    } catch (error) {
      throw new Error(`Error fetching user activity: ${error.message}`);
    }
  }

  static async getUserStats(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Calculate total investments
      const totalInvested = user.investments.reduce(
        (sum, inv) => sum + inv.amount,
        0
      );

      // Calculate active investments
      const activeInvestments = user.investments.filter(
        inv => inv.status === 'approved' && new Date(inv.expiresAt) > new Date()
      );

      // Calculate total withdrawals
      const totalWithdrawals = await Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: 'withdrawal',
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      return {
        totalEarnings: user.totalEarnings,
        totalInvested,
        activeInvestments: {
          count: activeInvestments.length,
          amount: activeInvestments.reduce((sum, inv) => sum + inv.amount, 0)
        },
        totalWithdrawals: totalWithdrawals[0]?.total || 0,
        referralStats: {
          totalReferrals: user.referrals.length,
          activeReferrals: user.referrals.filter(ref => ref.status === 'active').length,
          totalCommission: user.referrals.reduce((sum, ref) => sum + ref.commission, 0)
        },
        balances: {
          bitcoin: {
            available: user.bitcoinAvailable,
            pending: user.bitcoinPending
          },
          ethereum: {
            available: user.ethereumAvailable,
            pending: user.ethereumPending
          },
          usdt: {
            available: user.usdtAvailable,
            pending: user.usdtPending
          },
          totalAvailable: user.availableBalance,
          totalPending: user.pendingBalance,
          activeDeposit: user.activeDeposit
        }
      };
    } catch (error) {
      throw new Error(`Error fetching user stats: ${error.message}`);
    }
  }

  static async updateProfileRate(userId, newRate) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { profileRate: newRate },
        { new: true }
      );
      
      if (!user) throw new Error('User not found');
      
      return user;
    } catch (error) {
      throw new Error(`Error updating profile rate: ${error.message}`);
    }
  }

  static async updateLocation(userId, locationData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { location: locationData },
        { new: true }
      );
      
      if (!user) throw new Error('User not found');
      
      return user;
    } catch (error) {
      throw new Error(`Error updating location: ${error.message}`);
    }
  }
}

module.exports = ProfileService; 