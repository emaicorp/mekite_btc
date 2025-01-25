const User = require('../models/User');
const Transaction = require('../models/Transaction');

class WalletService {
  static async updateBalance(walletAddress, currency, amount, isWithdrawal) {
    try {
      const user = await User.findOne({ walletAddress });
      if (!user) throw new Error('User not found');

      const availableField = `${currency.toLowerCase()}Available`;
      const pendingField = `${currency.toLowerCase()}Pending`;

      if (isWithdrawal) {
        // Check if user has sufficient balance
        if (user[availableField] < amount) {
          throw new Error('Insufficient balance');
        }
        user[availableField] -= amount;
        user[pendingField] += amount;
      } else {
        user[availableField] += amount;
      }

      // Update total available balance
      user.availableBalance = 
        user.bitcoinAvailable + 
        user.ethereumAvailable + 
        user.usdtAvailable;

      await user.save();

      // Create transaction record
      const transaction = new Transaction({
        userId: user._id,
        type: isWithdrawal ? 'withdrawal' : 'deposit',
        currency,
        amount,
        status: isWithdrawal ? 'pending' : 'completed',
        walletAddress
      });
      await transaction.save();

      return {
        user,
        transaction,
        newBalance: user[availableField]
      };
    } catch (error) {
      throw new Error(`Error updating balance: ${error.message}`);
    }
  }

  static async createWithdrawalRequest(userId, currency, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const availableField = `${currency.toLowerCase()}Available`;
      if (user[availableField] < amount) {
        throw new Error('Insufficient balance');
      }

      const withdrawal = new Transaction({
        userId,
        type: 'withdrawal',
        currency,
        amount,
        status: 'pending',
        walletAddress: user[`${currency.toLowerCase()}Wallet`]
      });

      await withdrawal.save();
      return withdrawal;
    } catch (error) {
      throw new Error(`Error creating withdrawal request: ${error.message}`);
    }
  }

  static async getUserBalance(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      return {
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
        totalPending: user.pendingBalance
      };
    } catch (error) {
      throw new Error(`Error fetching balance: ${error.message}`);
    }
  }

  static async fundUserWallet(userId, currency, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const availableField = `${currency.toLowerCase()}Available`;
      user[availableField] += amount;
      user.availableBalance += amount;

      await user.save();
      return { user, updatedBalance: user[availableField] };
    } catch (error) {
      throw new Error(`Error funding wallet: ${error.message}`);
    }
  }
}

module.exports = WalletService; 