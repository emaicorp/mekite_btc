const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const axios = require('axios');  // To fetch location data using IP
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path if needed
const sendEmail = require('../emailUtils'); // Import the sendEmail function
require('dotenv').config();

const router = express.Router();

// Generate wallet address (mock function)
const generateWalletAddress = () => {
  return `0x${crypto.randomBytes(20).toString('hex')}`;
};

// Generate referral link
const generateReferralLink = (username) => {
  return `https://yourapp.com/register?ref=${username}`;
};

// Generate Reset Token
function generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Configure the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or any other email service you're using
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});
  
  router.post('/register', async (req, res) => {
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
      if (
        !fullName ||
        !username ||
        !password ||
        !email ||
        !recoveryQuestion ||
        !recoveryAnswer ||
        !agreedToTerms
      ) {
        return res.status(400).json({ message: 'All required fields must be filled.' });
      }
  
      // Check for existing user
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists.' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Generate wallet address and referral link
      const walletAddress = generateWalletAddress();
      const referralLink = generateReferralLink(username);
  
      // Handle referrals
      if (referredBy) {
        const referrer = await User.findOne({ username: referredBy });
        if (referrer) {
          referrer.referrals.push({
            referredBy: referrer.username,
            status: 'active',
            commission: 0,
          });
          await referrer.save();
        } else {
          return res.status(404).json({ message: 'Referrer not found.' });
        }
      }
  
      // Create new user
      const newUser = new User({
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
      });
  
      await newUser.save();
  
      // Send email with wallet address and referral link using sendEmail
      try {
        await sendEmail(
          email,
          'Welcome to Your App',
          `Hello ${fullName},\n\nThank you for registering. Here are your details:\n\nWallet Address: ${walletAddress}\nReferral Link: ${referralLink}\n\nBest regards,\nYour App Team`
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        return res.status(500).json({
          message: 'User registered but email sending failed.',
          details: emailError.message,
        });
      }
  
      res.status(201).json({
        message: 'User registered successfully. Wallet address and referral link sent to email.',
        userDetails: {
          fullName,
          username,
          email,
          walletAddress,
          referralLink,
        },
      });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });  


  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Validate request data
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
      }
  
      // Check if user exists
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      // Check if the user is disabled or suspended
      if (user.isDisabled) {
        return res.status(403).json({ message: 'Your account is disabled. Please contact support.' });
      }
  
      if (user.isSuspended) {
        return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'yourJWTSecret',
        { expiresIn: '1h' }
      );
  
      // Get the user's IP address
      const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
      // Fetch location data from ipinfo.io
      try {
        const locationResponse = await axios.get(`https://ipinfo.io/${userIp}/json?token=1b2549d3026893`);
        const locationData = locationResponse.data;
  
        // Check if location data is available
        if (locationData.city && locationData.country) {
          user.location = {
            ip: userIp,
            city: locationData.city,
            country: locationData.country,
          };
        }
      } catch (error) {
        console.error('Error fetching location from ipinfo.io:', error);
      }
  
      // Update user info
      user.lastSeen = Date.now();
      user.isOnline = true;
      await user.save();
  
      // Prepare a response specific to role
      let additionalDetails = {};
      if (user.role === 'admin') {
        // Admin-specific response (e.g., extra permissions, admin stats)
        additionalDetails = {
          adminPanelAccess: true,
          adminStats: {
            totalUsers: await User.countDocuments(),
            activeUsers: await User.countDocuments({ isOnline: true }),
          },
        };
      }
  
      // Return the response
      res.status(200).json({
        message: 'Login successful.',
        userDetails: {
            id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            recoveryQuestion: user.recoveryQuestion,
            recoveryAnswer: user.recoveryAnswer,
            bitcoinWallet: user.bitcoinWallet,
            ethereumWallet: user.ethereumWallet,
            usdtWallet: user.usdtWallet,
            referralLink: user.referralLink,
            walletAddress: user.walletAddress,
            bitcoinAvailable: user.bitcoinAvailable,
            bitcoinPending: user.bitcoinPending,
            ethereumAvailable: user.ethereumAvailable,
            ethereumPending: user.ethereumPending,
            usdtAvailable: user.usdtAvailable,
            usdtPending: user.usdtPending,
            totalWithdrawals: user.totalWithdrawals,
            availableBalance: user.availableBalance,
            totalEarnings: user.totalEarnings,
            lastSeen: user.lastSeen,
            isOnline: user.isOnline,
            location: user.location,
            referrals: user.referrals,
            investments: user.investments,
            emailVerified: user.emailVerified,
            isDisabled: user.isDisabled,
            isSuspended: user.isSuspended,
            role: user.role,
        },
        token, // Return token
        additionalDetails, // Include additional details for admin

    });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });
  

  // Forgotten Password Endpoint
// Forgotten Password Endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Check if the email exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }

    // If the email exists, allow navigation to reset password step
    res.status(200).json({ message: 'Email verified. Proceed to reset password.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});
  
  // Reset Password Endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Validate inputs
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

  
 // Endpoint to update the balance for Bitcoin, Ethereum, or USDT
router.put('/update-balance', async (req, res) => {
    try {
      const { walletAddress, currency, balanceChange, isWithdrawal } = req.body;  // balanceChange could be positive (deposit) or negative (withdrawal)
    
      // Validate inputs
      if (!walletAddress || !currency || balanceChange === undefined || isWithdrawal === undefined) {
        return res.status(400).json({ message: 'Wallet address, currency, balance change, and withdrawal status are required.' });
      }
    
      // Validate the currency (can be 'bitcoin', 'ethereum', or 'usdt')
      const validCurrencies = ['bitcoin', 'ethereum', 'usdt'];
      if (!validCurrencies.includes(currency)) {
        return res.status(400).json({ message: 'Invalid currency. Valid options are bitcoin, ethereum, or usdt.' });
      }
  
      // Find the user by wallet address
      const user = await User.findOne({ walletAddress });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this wallet address.' });
      }
  
      // Determine the currency fields based on the selected currency
      let availableField, pendingField;
      if (currency === 'bitcoin') {
        availableField = 'bitcoinAvailable';
        pendingField = 'bitcoinPending';
      } else if (currency === 'ethereum') {
        availableField = 'ethereumAvailable';
        pendingField = 'ethereumPending';
      } else if (currency === 'usdt') {
        availableField = 'usdtAvailable';
        pendingField = 'usdtPending';
      }
  
      // Handle the deposit (funding the account)
      if (!isWithdrawal) {
        user[availableField] += balanceChange; // Add funds to the available balance
      } else {
        // Handle withdrawal
        if (user[availableField] < balanceChange) {
          return res.status(400).json({ message: `Insufficient ${currency} balance for withdrawal.` });
        }
        user[availableField] -= balanceChange; // Deduct funds from the available balance
        user.totalWithdrawals += balanceChange; // Add the withdrawal amount to totalWithdrawals
      }
  
      // Update the overall available balance
      user.availableBalance = user.bitcoinAvailable + user.ethereumAvailable + user.usdtAvailable;
  
      // Save the updated user object
      await user.save();
  
      // Send a confirmation email for successful deposit
      if (!isWithdrawal) {
        const mailOptions = {
          from: process.env.EMAIL_USER,  // Sender address
          to: user.email,  // Recipient address (user's email)
          subject: 'Deposit Successful',  // Email subject
          text: `Dear ${user.fullName},\n\nYour deposit of ${balanceChange} ${currency} has been successfully credited to your account.\n\nYour new available balance is: ${user.availableBalance}.\n\nThank you for using our service!`,  // Email body
        };
  
        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      }
  
      // Return the updated balance information
      res.status(200).json({
        message: `${isWithdrawal ? 'Withdrawal' : 'Deposit'} successful.`,
        availableBalance: user.availableBalance,
        bitcoinAvailable: user.bitcoinAvailable,
        ethereumAvailable: user.ethereumAvailable,
        usdtAvailable: user.usdtAvailable,
        pendingBalance: user[pendingField],
        totalWithdrawals: user.totalWithdrawals,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });    
  
  // Endpoint to get all users
router.get('/all-users', async (req, res) => {
    try {
      // Fetch all users from the database
      const users = await User.find();
  
      // If no users found
      if (users.length === 0) {
        return res.status(404).json({ message: 'No users found.' });
      }
  
      // Return the list of users
      res.status(200).json({
        message: 'Users fetched successfully.',
        users: users, // This will return an array of user objects
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });

  // Endpoint to handle referral link click
router.post('/referral-link', async (req, res) => {
    try {
      const { referralLink } = req.body; // Referral link that was clicked
  
      // Validate that the referral link is provided
      if (!referralLink) {
        return res.status(400).json({ message: 'Referral link is required.' });
      }
  
      // Find the user who owns the referral link
      const referredUser = await User.findOne({ referralLink });
  
      if (!referredUser) {
        return res.status(404).json({ message: 'Referral link is invalid.' });
      }
  
      // Assuming a fixed amount of earnings for each referral click (can be dynamic)
      const referralEarnings = 10; // For example, $10 per referral click
  
      // Update the total earnings of the user who owns the referral link
      referredUser.totalEarnings += referralEarnings;
      await referredUser.save(); // Save the updated user
  
      // Respond with the updated earnings
      res.status(200).json({
        message: 'Referral link clicked successfully.',
        totalEarnings: referredUser.totalEarnings,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });

  const authenticateUser = async (req, res, next) => {
    try {
      const userId = req.headers['user-id'] || req.body.userId;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      req.user = user; // Attach user to the request object
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Authentication error.' });
    }
  };

router.post('/invest', async (req, res) => {
  try {
    const userId = req.headers['user-id'] || req.body.userId;
    const { selectedPackage, paymentMethod, amount } = req.body;

    // Validate inputs
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    if (!selectedPackage || !paymentMethod || !amount) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Create a new investment
    const newInvestment = {
      selectedPackage,
      paymentMethod,
      amount,
      status: 'pending',
    };

    // Add the investment to the user's record
    user.investments.push(newInvestment);
    await user.save();

    // Respond to the client
    res.status(200).json({ message: 'Investment submitted successfully.', investment: newInvestment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
});
  
  // Get user's pending withdrawals
  router.get('/withdrawals/pending', authenticateUser, async (req, res) => {
    try {
      const pendingWithdrawals = req.user.investments.filter(investment => investment.status === 'pending');
      res.status(200).json({ pendingWithdrawals });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error.' });
    }
  });
  
  // Admin gets all pending withdrawals
  router.get('/admin/withdrawals/pending', async (req, res) => {
    try {
      const users = await User.find({ 'investments.status': 'pending' });
      const pendingWithdrawals = users.map(user => ({
        userId: user._id,
        username: user.username,
        investments: user.investments.filter(inv => inv.status === 'pending'),
      }));
  
      res.status(200).json({ pendingWithdrawals });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error.' });
    }
  });
  
  // Admin approves or rejects a withdrawal
  router.post('/admin/withdrawals/:action', async (req, res) => {
    try {
      const { action } = req.params; // "approve" or "reject"
      const { userId, investmentIndex } = req.body;
  
      if (!userId || investmentIndex === undefined) {
        return res.status(400).json({ message: 'User ID and investment index are required.' });
      }
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found.' });
  
      const investment = user.investments[investmentIndex];
      if (!investment || investment.status !== 'pending') {
        return res.status(400).json({ message: 'Invalid or already processed investment.' });
      }
  
      if (action === 'approve') {
        investment.status = 'approved';
  
        // Update user's available balance based on payment method
        if (investment.paymentMethod === 'bitcoin') {
          user.bitcoinAvailable += investment.amount;
        } else if (investment.paymentMethod === 'usdt') {
          user.usdtAvailable += investment.amount;
        } else if (investment.paymentMethod === 'ethereum') {
          user.ethereumAvailable += investment.amount;
        }
  
      } else if (action === 'reject') {
        investment.status = 'rejected';
      } else {
        return res.status(400).json({ message: 'Invalid action.' });
      }
  
      await user.save();
  
      res.status(200).json({ message: `Investment ${action}d successfully.`, user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error.' });
    }
  });
  
  router.post('/referrals/commission', async (req, res) => {
    try {
      const { username, commissionAmount } = req.body; // Use the username as the referrer identifier
  
      // Find the user who referred others
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(404).json({ message: 'Referrer not found' });
      }
  
      // Update total referral earnings
      user.totalReferralEarnings += commissionAmount;
  
      // Update the specific referral if needed
      const referral = user.referrals.find((ref) => ref.referredBy === username);
      if (referral) {
        referral.commission += commissionAmount;
      }
  
      await user.save();
  
      res.status(200).json({
        message: 'Referral commission updated successfully',
        totalReferralEarnings: user.totalReferralEarnings,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating referral commission', error: error.message });
    }
  });

  router.put('/profile/update', authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id; // Assuming `authenticateUser` attaches the user's ID to `req.user`
      const { bitcoinWallet, ethereumWallet, usdtWallet, username } = req.body;
  
      // Validation
      if (!bitcoinWallet && !ethereumWallet && !usdtWallet && !username) {
        return res.status(400).json({ message: 'No fields provided for update.' });
      }
  
      // Check for duplicate username if it's being updated
      if (username) {
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
          return res.status(400).json({ message: 'Username is already taken.' });
        }
      }
  
      // Update user fields
      const updatedFields = {};
      if (bitcoinWallet) updatedFields.bitcoinWallet = bitcoinWallet;
      if (ethereumWallet) updatedFields.ethereumWallet = ethereumWallet;
      if (usdtWallet) updatedFields.usdtWallet = usdtWallet;
      if (username) updatedFields.username = username;
  
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updatedFields },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      res.status(200).json({
        message: 'Profile updated successfully.',
        userDetails: {
          bitcoinWallet: updatedUser.bitcoinWallet,
          ethereumWallet: updatedUser.ethereumWallet,
          usdtWallet: updatedUser.usdtWallet,
          username: updatedUser.username,
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });
  
  router.get('/profile/activity', authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
  
      const user = await User.findById(userId).select(
        'username email bitcoinAvailable ethereumAvailable usdtAvailable referrals totalWithdrawals totalEarnings investments lastSeen isOnline location'
      );
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const activityData = {
        username: user.username,
        email: user.email,
        walletBalances: {
          bitcoin: { available: user.bitcoinAvailable },
          ethereum: { available: user.ethereumAvailable },
          usdt: { available: user.usdtAvailable },
        },
        referrals: user.referrals,
        totalWithdrawals: user.totalWithdrawals,
        totalEarnings: user.totalEarnings,
        investments: user.investments,
        lastSeen: user.lastSeen,
        isOnline: user.isOnline,
        location: user.location,
      };
  
      res.status(200).json({
        message: 'User activity retrieved successfully.',
        activity: activityData,
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }); 

router.post('/admin/manage-user', async (req, res) => {
  const { action, userId } = req.body;

  try {
    // Ensure required fields are provided
    if (!action || !userId) {
      return res.status(400).json({ message: 'Action and userId are required.' });
    }

    // Fetch the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Handle the requested action
    switch (action) {
      case 'verify-email':
        user.emailVerified = true; // Assuming an `emailVerified` field in the schema
        await user.save();
        return res.status(200).json({ message: 'Email verified successfully.' });

      case 'disable-account':
        user.isDisabled = true; // Assuming an `isDisabled` field in the schema
        await user.save();
        return res.status(200).json({ message: 'Account disabled successfully.' });

      case 'suspend-account':
        user.isSuspended = true; // Assuming an `isSuspended` field in the schema
        await user.save();
        return res.status(200).json({ message: 'Account suspended successfully.' });

      default:
        return res.status(400).json({ message: 'Invalid action provided.' });
    }
  } catch (error) {
    console.error('Error managing user account:', error);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});


router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


module.exports = router;
