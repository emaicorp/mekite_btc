const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserService = require('../services/userService');
const EmailService = require('../services/emailService');
const { generateWalletAddress, generateReferralLink } = require('../utils/walletUtils');

class AuthController {
  static async register(req, res) {
    try {
      const {
        fullName,
        username,
        password,
        email,
        recoveryQuestion,
        recoveryAnswer,
        agreedToTerms,
        referredBy
      } = req.body;

      // Validation
      if (!fullName || !username || !password || !email || !recoveryQuestion || 
          !recoveryAnswer || !agreedToTerms) {
        return res.status(400).json({ message: 'All required fields must be filled.' });
      }

      // Check existing user
      const existingUser = await UserService.findByUsernameOrEmail(username, email);
      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists.' });
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const walletAddress = generateWalletAddress();
      const referralLink = generateReferralLink(username);

      const userData = {
        fullName,
        username,
        password: hashedPassword,
        email,
        recoveryQuestion,
        recoveryAnswer,
        walletAddress,
        referralLink,
        agreedToTerms,
        upline: referredBy || null,
      };

      const newUser = await UserService.createUser(userData);

      // Send welcome email
      await EmailService.sendWelcomeEmail(newUser);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: {
          fullName: newUser.fullName,
          username: newUser.username,
          email: newUser.email,
          referralLink: newUser.referralLink
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: error.message });
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

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

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