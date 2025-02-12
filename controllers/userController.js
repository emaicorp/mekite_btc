const UserService = require('../services/userService');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Wallet = require('../models/Wallet');

class UserController {
  static async register(req, res) {
    try {
      const userData = req.body;
      const user = await UserService.createUser(userData);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async updateBalance(req, res) {
    try {
      const { userId } = req.params;
      const balanceUpdates = req.body;
      const user = await UserService.updateBalance(userId, balanceUpdates);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async addInvestment(req, res) {
    try {
      const { userId } = req.params;
      const investmentData = req.body;
      const user = await UserService.addInvestment(userId, investmentData);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .select('-password')
        .populate([
          {
            path: 'referredBy',
            select: 'username email fullName'
          },
          {
            path: 'investments',
            select: 'amount status planId createdAt selectedPackage '
          },
          {
            path: 'transactions',
            select: 'type amount status createdAt'
          }
        ]);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      // Get referral statistics
      const referralStats = await Referral.aggregate([
        { $match: { referrerId: user._id } },
        { $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          totalCommission: { $sum: '$commission' },
          activeReferrals: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }}
      ]);
  
      // Get wallet information
      const wallet = await Wallet.findOne({ userId: user._id });
  
      res.json({
        success: true,
        data: {
          ...user.toObject(),
          referralStats: referralStats[0] || {
            totalReferrals: 0,
            totalCommission: 0,
            activeReferrals: 0
          },
          wallet: wallet || {}
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const allowedUpdates = [
        'fullName', 
        'username', 
        'email', 
        'recoveryQuestion', 
        'recoveryAnswer',
        'password',
        'walletAddresses'
      ];
      
      const updates = Object.keys(req.body);
      const isValidOperation = updates.every(update => allowedUpdates.includes(update));

      if (!isValidOperation) {
        return res.status(400).json({
          success: false,
          message: 'Invalid updates'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email/username already exists
      if (req.body.email || req.body.username) {
        const existingUser = await User.findOne({
          $and: [
            { _id: { $ne: req.user.id } },
            {
              $or: [
                { email: req.body.email || '' },
                { username: req.body.username || '' }
              ]
            }
          ]
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email or username already exists'
          });
        }
      }

      // Handle regular updates
      updates.forEach(update => {
        if (update !== 'password' && update !== 'walletAddresses') {
          user[update] = req.body[update];
        }
      });

      // Handle password update if provided
      if (req.body.password && req.body.password.trim() !== '') {
        user.password = req.body.password;
      }

      // Handle wallet addresses update
      if (req.body.walletAddresses) {
        user.bitcoinWallet = req.body.walletAddresses.bitcoin || user.bitcoinWallet || '';
        user.ethereumWallet = req.body.walletAddresses.ethereum || user.ethereumWallet || '';
        user.usdtWallet = req.body.walletAddresses.usdt || user.usdtWallet || '';
      }

      await user.save();

      // Remove sensitive data
      const userResponse = user.toObject();
      delete userResponse.password;

      // Format response data with correct wallet address access
      const responseData = {
        ...userResponse
      };

      // Remove individual wallet fields from response
   

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: responseData
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = UserController; 