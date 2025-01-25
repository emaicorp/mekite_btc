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
        referredBy,
        bitcoinWallet,
        ethereumWallet,
        usdtWallet,
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
        bitcoinWallet,
        ethereumWallet,
        usdtWallet,
        upline: referredBy || null,
      };

      const newUser = await UserService.createUser(userData);

      // Handle referral if exists
      if (referredBy) {
        await UserService.processReferral(referredBy, username);
      }

      // Send welcome email
      await EmailService.sendWelcomeEmail(newUser);

      res.status(201).json({
        message: 'User registered successfully',
        userDetails: {
          fullName: newUser.fullName,
          username: newUser.username,
          email: newUser.email,
          walletAddress: newUser.walletAddress,
          referralLink: newUser.referralLink,
          upline: newUser.upline,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration.' });
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

      if (user.isDisabled || user.isSuspended) {
        return res.status(403).json({ 
          message: `Your account is ${user.isDisabled ? 'disabled' : 'suspended'}. Please contact support.` 
        });
      }

      // Update user status
      await UserService.updateLoginStatus(user._id);

      // Generate token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        userDetails: await UserService.getUserDetails(user._id)
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login.' });
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

      // Generate reset token
      const resetToken = await UserService.generateResetToken(user._id);

      // Send reset email
      await EmailService.sendPasswordResetEmail(email, resetToken);

      res.status(200).json({ message: 'Password reset instructions sent to email.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Server error during password reset request.' });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and new password are required.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await UserService.updatePassword(email, hashedPassword);

      res.status(200).json({ message: 'Password reset successful.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Server error during password reset.' });
    }
  }
}

module.exports = AuthController; 