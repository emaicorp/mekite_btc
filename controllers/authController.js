const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserService = require('../services/userService');
const EmailService = require('../services/emailService');
const { generateWalletAddress, generateReferralLink } = require('../utils/walletUtils');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Wallet = require('../models/Wallet');
const crypto = require('crypto');

class AuthController {
  static async register(req, res) {
    try {
      // Log raw request body for debugging
      console.log('Raw request body:', req.body);

      // Create userData directly from req.body with validation
      const userData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        fullName: req.body.fullName || req.body.fullname, // Handle different casing
        referralcode: req.body.referralcode || req.body.referredBy,
        recoveryQuestion: req.body.recoveryQuestion,
        recoveryAnswer: req.body.recoveryAnswer,
        agreedToTerms: req.body.agreedToTerms
      };

      console.log("Processed userData:", userData);

      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }

      // Check if user already exists using UserService
      const existingUser = await UserService.findByUsernameOrEmail(userData.username, userData.email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or username already exists'
        });
      }

      // Generate unique referral code for new user
      const newReferralCode = crypto.randomBytes(4).toString('hex');
      // userData.referralcode = userData.username;

      // Create new user using UserService
      const user = await UserService.createUser(userData);
      console.log("Created user:", user);

      await EmailService.sendWelcomeEmail(user)
      // Create wallet for new user
      // await Wallet.createForUser(user._id);

      // Process referral if referral code was provided
      if (userData.referralcode) {
        console.log("referral code",userData.referralcode)
        const referrer = await UserService.findByUsername(userData.referralcode);
        console.log("referrer", referrer)
        if (referrer) {
          // Create referral relationship
          await Referral.create({
            referrerId: referrer._id,
            referredId: user._id,
            status: 'pending',
            level: 1
          });

          // Update user's referrer
          await UserService.updateUser(user._id, { referredBy: referrer._id });

          // Send referral notification email
          await EmailService.sendReferralRegistrationNotification(
            referrer,
            {
              referredUser: {
                username: user.username,
                email: user.email,
                fullName: user.fullName
              }
            }
          );

          // Process upper level referrals
          await AuthController.processUpperLevelReferrals(user._id, referrer._id);
        }
      }

      // Get JWT token using UserService
      const token = await UserService.generateAuthToken(user);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            referralCode: user.referralCode
          }
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Helper method to process upper level referrals
  static async processUpperLevelReferrals(userId, referrerId, currentLevel = 1) {
    try {
      if (currentLevel >= 3) return; // Max 3 levels

      // Find referrer's referrer (upper level)
      const upperReferral = await Referral.findOne({ referredId: referrerId });
      
      if (upperReferral) {
        // Create next level referral relationship
        await Referral.create({
          referrerId: upperReferral.referrerId,
          referredId: userId,
          status: 'pending',
          level: currentLevel + 1
        });

        // Process next level
        await AuthController.processUpperLevelReferrals(
          userId, 
          upperReferral.referrerId, 
          currentLevel + 1
        );
      }
    } catch (error) {
      console.error('Error processing upper level referrals:', error);
    }
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
      }

      const user = await UserService.findByUsername(username);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // const isValidPassword = await bcrypt.compare(password, user.password);
      // if (!isValidPassword) {
      //   console.log(password,username);
      //   return res.status(401).json({ message: 'Invalid credentials.' });
      // }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
      }

      const user = await UserService.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const resetToken = await UserService.generateResetToken(user._id);
      await EmailService.sendPasswordResetEmail(email, resetToken);

      res.status(200).json({
        success: true,
        message: 'Password reset instructions sent to email.'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await UserService.updatePasswordWithToken(token, hashedPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successful.'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
      }

      const user = await UserService.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await UserService.updatePassword(user.email, hashedPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully.'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async verifyToken(req, res) {
    try {
      const user = await UserService.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = AuthController; 