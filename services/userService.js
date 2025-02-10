const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class UserService {
  static async createUser(userData) {
    try {
      console.log(userData)
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async findByUsernameOrEmail(username, email) {
    try {
      return await User.findOne({
        $or: [{ username }, { email }]
      });
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async findByUsername(username) {
    try {
      return await User.findOne({ username });
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async updateLoginStatus(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        {
          lastSeen: new Date(),
          isOnline: true
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating login status: ${error.message}`);
    }
  }

  static async generateResetToken(userId) {
    try {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      await User.findByIdAndUpdate(userId, {
        resetToken,
        resetTokenExpiry
      });

      return resetToken;
    } catch (error) {
      throw new Error(`Error generating reset token: ${error.message}`);
    }
  }

  static async updatePassword(email, hashedPassword) {
    try {
      return await User.findOneAndUpdate(
        { email },
        {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  static async getUserDetails(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) throw new Error('User not found');

      return {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        walletAddress: user.walletAddress,
        bitcoinWallet: user.bitcoinWallet,
        ethereumWallet: user.ethereumWallet,
        usdtWallet: user.usdtWallet,
        availableBalance: user.availableBalance,
        pendingBalance: user.pendingBalance,
        totalEarnings: user.totalEarnings,
        referralLink: user.referralLink,
        investments: user.investments,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      };
    } catch (error) {
      throw new Error(`Error getting user details: ${error.message}`);
    }
  }

  static async updateUserStatus(userId, statusUpdates) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { $set: statusUpdates },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating user status: ${error.message}`);
    }
  }

  static async generateAuthToken(user) {
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static async findByReferralCode(referralCode) {
    try {
      return await User.findOne({ referralCode });
    } catch (error) {
      throw new Error(`Error finding user by referral code: ${error.message}`);
    }
  }

  static async updateUser(userId, updateData) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }
}

module.exports = UserService; 