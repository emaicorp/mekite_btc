const ProfileService = require('../services/profileService');
const UserService = require('../services/userService');
const EmailService = require('../services/emailService');
const User = require('../models/User');
const Activity = require('../models/Activity');

class ProfileController {
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      res.json({
        success: true,
        data: user
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
      const { fullName, phoneNumber, country, walletAddresses } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          fullName,
          phoneNumber,
          country,
          walletAddresses
        },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getActivity(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const type = req.query.type;

      const query = { userId: req.user.id };
      if (type) {
        query.type = type;
      }

      const activities = await Activity.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const totalCount = await Activity.countDocuments(query);

      res.json({
        success: true,
        data: {
          activities,
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getStats(req, res) {
    try {
      const user = await User.findById(req.user.id);
      const stats = {
        totalInvestments: user.totalInvestments || 0,
        activeInvestments: user.activeInvestments || 0,
        totalEarnings: user.totalEarnings || 0,
        pendingWithdrawals: user.pendingWithdrawals || 0,
        totalReferrals: user.referrals?.length || 0,
        referralEarnings: user.referralEarnings || 0
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async sendVerificationEmail(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Generate verification token and send email
      // This should be implemented in your EmailService
      await user.generateEmailVerificationToken();
      await user.save();

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ProfileController; 