const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

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

  static async getAdminWallets() {
    try {
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) throw new Error('Admin not found');

      return {
        bitcoin: adminUser.bitcoinWallet,
        ethereum: adminUser.ethereumWallet,
        usdt: adminUser.usdtWallet
      };
    } catch (error) {
      throw new Error(`Error fetching admin wallets: ${error.message}`);
    }
  }

  static async updateAdminWallet(currency, address) {
    try {
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) throw new Error('Admin not found');

      const walletField = `${currency.toLowerCase()}Wallet`;
      adminUser[walletField] = address;
      await adminUser.save();

      return {
        currency,
        address,
        message: `${currency} wallet updated successfully`
      };
    } catch (error) {
      throw new Error(`Error updating admin wallet: ${error.message}`);
    }
  }

  static async deleteAdminWallet(currency) {
    try {
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) throw new Error('Admin not found');

      const walletField = `${currency.toLowerCase()}Wallet`;
      adminUser[walletField] = null;
      await adminUser.save();

      return {
        message: `${currency} wallet deleted successfully`
      };
    } catch (error) {
      throw new Error(`Error deleting admin wallet: ${error.message}`);
    }
  }

  static async createWallet(walletData) {
    try {
      const wallet = new Wallet(walletData);
      await wallet.save();
      return wallet;
    } catch (error) {
      throw new Error(`Error creating wallet: ${error.message}`);
    }
  }

  static async getAllWallets() {
    try {
      return await Wallet.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching wallets: ${error.message}`);
    }
  }

  static async getWalletsByCurrency(currency) {
    try {
      return await Wallet.find({ 
        currency, 
        isActive: true 
      });
    } catch (error) {
      throw new Error(`Error fetching ${currency} wallets: ${error.message}`);
    }
  }

  static async updateWallet(walletId, updateData) {
    try {
      const wallet = await Wallet.findByIdAndUpdate(
        walletId,
        updateData,
        { new: true, runValidators: true }
      );
      if (!wallet) throw new Error('Wallet not found');
      return wallet;
    } catch (error) {
      throw new Error(`Error updating wallet: ${error.message}`);
    }
  }

  static async deleteWallet(walletId) {
    try {
      const wallet = await Wallet.findByIdAndDelete(walletId);
      if (!wallet) throw new Error('Wallet not found');
      return wallet;
    } catch (error) {
      throw new Error(`Error deleting wallet: ${error.message}`);
    }
  }
}

module.exports = WalletService; 