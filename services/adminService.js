const User = require('../models/User');
const Transaction = require('../models/Transaction');

class AdminService {
  static async getAllUsers() {
    try {
      return await User.find();
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  static async manageUserAccount(userId, updates = {}) {
    try {
      // Add validation for updates parameter
      if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
        throw new Error('No updates provided');
      }

      const allowedUpdates = [
        'username', 'email', 'role', 'status', 'password',
        'availableBalance', 'balanceAction'
      ];
      
      const updateKeys = Object.keys(updates);
      const isValidUpdate = updateKeys.every(key => allowedUpdates.includes(key));
      
      if (!isValidUpdate) {
        throw new Error('Invalid update fields');
      }

      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Handle email uniqueness check
   

      // Handle balance updates
      if (updates.availableBalance) {
        const amount = parseFloat(updates.availableBalance);
        if (isNaN(amount)) {
          throw new Error('Invalid balance amount');
        }

        switch (updates.balanceAction) {
          case 'add':
            user.availableBalance += amount;
            break;
          case 'subtract':
            if (user.availableBalance < amount) {
              throw new Error('Insufficient balance');
            }
            user.availableBalance -= amount;
            break;
          case 'set':
            user.availableBalance = amount;
            break;
          default:
            throw new Error('Invalid balance action. Use "add", "subtract", or "set"');
        }

        // // Remove these from updates to prevent double processing
        // delete updates.availableBalance;
        // delete updates.balanceAction;
      }else{
        if (updates.email && updates.email !== user.email) {
          const existingUser = await User.findOne({ email: updates.email });
          if (existingUser) {
            throw new Error('Email already exists');
          }
        }
      }

      // Apply remaining updates
      updateKeys.forEach(key => {
        if (key !== 'availableBalance' && key !== 'balanceAction') {
          user[key] = updates[key];
        }
      });

      await user.save();
    
      return user;
    } catch (error) {
      throw new Error(`Error updating user account: ${error.message}`);
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