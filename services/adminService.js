const User = require('../models/User');
const Transaction = require('../models/Transaction');

class AdminService {
  static async getAllUsers() {
    try {
      return await User.find().select('-password');
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  static async manageUserAccount(userId, action, reason) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      switch (action) {
        case 'suspend':
          user.isSuspended = true;
          break;
        case 'unsuspend':
          user.isSuspended = false;
          break;
        case 'disable':
          user.isDisabled = true;
          break;
        case 'enable':
          user.isDisabled = false;
          break;
        default:
          throw new Error('Invalid action');
      }

      await user.save();
      return { user, action, reason };
    } catch (error) {
      throw new Error(`Error managing user account: ${error.message}`);
    }
  }

  static async getPendingTransactions() {
    try {
      return await Transaction.find({ status: 'pending' })
        .populate('userId', 'username email');
    } catch (error) {
      throw new Error(`Error fetching pending transactions: ${error.message}`);
    }
  }

  static async approveCurrencyTransaction(userId, currency, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const pendingField = `${currency.toLowerCase()}Pending`;
      const availableField = `${currency.toLowerCase()}Available`;

      // Move amount from pending to available
      if (user[pendingField] < amount) {
        throw new Error('Insufficient pending balance');
      }

      user[pendingField] -= amount;
      user[availableField] += amount;

      await user.save();
      return { user, currency, amount };
    } catch (error) {
      throw new Error(`Error approving currency: ${error.message}`);
    }
  }

  static async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  static async updateActiveDeposit(userId, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      user.activeDeposit += amount;
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error updating active deposit: ${error.message}`);
    }
  }

  static async updateTotalEarnings(userId, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      user.totalEarnings += amount;
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error updating total earnings: ${error.message}`);
    }
  }

  static async deductFromDeposit(userId, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      if (user.activeDeposit < amount) {
        throw new Error('Insufficient active deposit');
      }

      user.activeDeposit -= amount;
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error deducting deposit: ${error.message}`);
    }
  }
}

module.exports = AdminService; 