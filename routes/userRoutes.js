const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail  = require('../emailUtils');
const User = require('../models/UserModels'); // Import User model
const authenticateUser = require('../middleware/authMiddleware');
const Investment = require('../models/Investment'); // Ensure Investment schema is correctly imported

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { fullname, username, email, password, secretQuestion, secretAnswer, wallets } = req.body;

    // Check for existing username or email
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.username === username
          ? 'Username is already taken.'
          : 'Email is already registered.',
      });
    }

    // Validate wallets
    if (wallets && typeof wallets !== 'object') {
      return res.status(400).json({ message: 'Invalid wallets format.' });
    }

    // Hash the password and secret answer
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecretAnswer = await bcrypt.hash(secretAnswer, 10);

    // Create the user
    const newUser = new User({
      fullname,
      username,
      email,
      password: hashedPassword,
      security: { secretQuestion, secretAnswer: hashedSecretAnswer },
      wallets: wallets || {}, // Handle optional wallets
    });

    const savedUser = await newUser.save();

    // Prepare email content
    const walletAddress = newUser.walletAddress;
    const emailSubject = 'Registration Successful';

    const emailText = `Welcome, ${fullname}!\n\nYou have successfully registered. Your wallet address is ${walletAddress}.`;

    const emailHtml = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f7fa;
              color: #333;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              font-size: 24px;
              color: #4CAF50;
            }
            .content {
              font-size: 16px;
              margin-top: 10px;
            }
            .wallet-address {
              font-weight: bold;
              color: #007BFF;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              Welcome, ${fullname}!
            </div>
            <div class="content">
              <p>Congratulations on successfully registering with our platform. We are excited to have you on board!</p>
              <p>Your wallet address is:</p>
              <p class="wallet-address">${walletAddress}</p>
              <p>Please keep it secure and use it for your transactions.</p>
            </div>
            <div class="footer">
              <p>Thank you for choosing our platform!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send welcome email
    try {
      await sendEmail(email, emailSubject, emailText, emailHtml);
    } catch (emailError) {
      console.error('Failed to send email:', emailError.message);
    }

    res.status(201).json({ message: 'User registered successfully', user: savedUser });
  } catch (error) {
    console.error('Error in /register endpoint:', error.message);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        message: 'Both email and password are required. Please provide them.',
        style: 'error',
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email. Please check your email or register.',
        style: 'error',
      });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'The password you entered is incorrect. Please try again.',
        style: 'error',
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, roles: user.roles }, 'your_jwt_secret', { expiresIn: '1h' });

    // Send a customized email on successful login
    await sendEmail(
      user.email,
      'Login Successful - Welcome Back!',
      `Hi ${user.fullname},\n\nYou have successfully logged in to your account.\n\nYour wallet address is: ${user.walletAddress}.\n\nIf you have any questions, feel free to contact support.`
    );

    // Exclude sensitive info like password
    const { password: _, ...userDetails } = user.toObject();
    
    res.status(200).json({
      message: 'Login successful! You are now logged in.',
      style: 'success',
      token,
      user: userDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: `An unexpected error occurred. Please try again later. ${error.message}`,
      style: 'error',
    });
  }
});
  
// Update Profile
router.put('/update-profile', async (req, res) => {
  try {
    const { id, fullname, username, email, wallets } = req.body;

    const updateFields = {
      ...(fullname && { fullname }),
      ...(username && { username }),
      ...(email && { email }),
      ...(wallets && { wallets }),
    };

    const updatedUser = await User.findByIdAndUpdate(id, updateFields, { new: true });

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Details
router.get('/details/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, secretAnswer } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.security.secretAnswer !== secretAnswer)
      return res.status(400).json({ message: 'Invalid secret answer' });

    res.status(200).json({ message: 'Secret answer validated. Proceed to reset your password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to find user by ID
const findUserById = async (req, res, next) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      req.user = user; // Attach user to request object
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Get balance
  router.get('/:userId/balance', findUserById, (req, res) => {
    const balance = req.user.getBalance();
    res.status(200).json({ message: 'Balance retrieved successfully', balance });
  });
  
  router.post('/:userId/deposit', findUserById, async (req, res) => {
    try {
      const { currency, amount } = req.body;
  
      if (!currency || amount == null) {
        return res.status(400).json({ message: 'Currency and amount are required' });
      }
  
      if (!['usdt', 'ethereum', 'bitcoin'].includes(currency)) {
        return res.status(400).json({ message: `Unsupported currency: ${currency}` });
      }
  
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }
  
      // Add deposit to user
      req.user.deposits.push({ currency, amount });
      await req.user.save();
  
      res.status(201).json({ message: 'Deposit added successfully', deposit: req.user.deposits.slice(-1)[0] });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update balance (for admins or specific logic)
router.put('/:userId/balance', findUserById, async (req, res) => {
    try {
      const { currency, amount } = req.body;
  
      // Validate input
      if (!currency || amount == null) {
        return res.status(400).json({ message: 'Currency and amount are required' });
      }
  
      if (!['usdt', 'ethereum', 'bitcoin'].includes(currency)) {
        return res.status(400).json({ message: `Invalid currency: ${currency}` });
      }
  
      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ message: 'Amount must be a non-negative number' });
      }
  
      // Update balance
      const currentBalance = req.user.balance[currency] || 0;
      req.user.balance[currency] = amount; // Directly update the balance
  
      // Save user
      await req.user.save();
  
      // Send email notification
      await sendEmail(
        req.user.email,
        'Balance Updated',
        `Hello ${req.user.fullname},\n\nYour ${currency.toUpperCase()} balance has been updated to ${amount}. Previous balance was ${currentBalance}.`
      );
  
      // Respond with success
      res.status(200).json({
        message: 'Balance updated successfully',
        balance: req.user.getBalance(),
      });
    } catch (error) {
      // Log error for debugging
      console.error(`Error updating balance for user ${req.params.userId}:`, error.message);
  
      res.status(500).json({ message: 'Internal server error' });
    }
  });  
  
  router.get('/:userId/active-deposits', findUserById, (req, res) => {
    try {
      const activeDeposits = req.user.getActiveDeposits();
      res.status(200).json({
        message: 'Active deposits retrieved successfully',
        deposits: activeDeposits,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  router.post('/:userId/add-earnings', findUserById, async (req, res) => {
    try {
      const { amount } = req.body;
  
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Valid earnings amount is required' });
      }
  
      await req.user.addEarnings(amount);
  
      res.status(200).json({
        message: `Earnings added successfully.`,
        totalEarnings: req.user.getTotalEarnings(),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  router.get('/:userId/total-earnings', findUserById, (req, res) => {
    try {
      res.status(200).json({
        message: 'Total earnings retrieved successfully.',
        totalEarnings: req.user.getTotalEarnings(),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  router.post('/:userId/add-activity', findUserById, async (req, res) => {
    try {
      const { action } = req.body;
  
      if (!action) {
        return res.status(400).json({ message: 'Action description is required' });
      }
  
      await req.user.addActivity(action);
  
      res.status(200).json({
        message: 'Activity added successfully.',
        latestActivity: req.user.getLatestActivity(),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get('/:userId/latest-activity', findUserById, async (req, res) => {
    try {
      const latestActivity = req.user.getLatestActivity();
  
      if (!latestActivity) {
        return res.status(404).json({ message: 'No activities found for this user.' });
      }
  
      res.status(200).json({
        message: 'Latest activity retrieved successfully.',
        latestActivity,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
// Get user activities for the dashboard
router.get('/dashboard/activities', authenticateUser, async (req, res) => {
  try {
    // Retrieve the authenticated user's activities
    const user = await User.findById(req.user.id).select('activities'); // `req.user` is set by `authenticateUser`
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Optionally limit to the last 10 activities for the dashboard
    const recentActivities = user.activities.slice(0, 10);

    res.status(200).json({
      message: 'User activities retrieved successfully.',
      activities: recentActivities,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities.', error: error.message });
  }
});

router.post('/invest', async (req, res) => {
    try {
      const { userId, investmentPlan, amount, paymentMethod, reInvest } = req.body;
  
      // Find the user by ID
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Logic for investment
      const investmentSource = reInvest ? 're-investment' : 'new investment';
  
      // Handle re-investment logic
      if (reInvest) {
        if (user.balance.usdt < amount) {
          return res.status(400).json({ error: 'Insufficient balance for re-investment' });
        }
        user.balance.usdt -= amount; // Deduct from balance
      }
  
      // Save the investment in the Investment collection
      const investment = new Investment({
        userId,
        investmentPlan,
        amount,
        paymentMethod,
        status: 'active',
      });
  
      await investment.save(); // Save investment
  
      // Update user's deposits
      user.deposits.push({
        amount,
        currency: 'usdt', // Assuming USDT for this example
        status: 'active', // Status can be adjusted based on the logic
      });
  
      // Log the investment activity
      if (!Array.isArray(user.activities)) {
        user.activities = []; // Initialize if undefined
      }
  
      user.activities.unshift({
        action: `Made an investment using ${investmentSource}`,
        investmentPlan,
        amount,
        paymentMethod: reInvest ? 're-invest' : paymentMethod,
      });
  
      // Optionally update total earnings
      user.totalEarnings += amount;
  
      // Save the updated user
      await user.save();
  
      res.status(200).json({
        message: `Investment successfully processed as ${investmentSource}`,
        user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });    

  router.post('/withdraw', async (req, res) => {
    try {
      const { userId, amount, currency, withdrawalAddress } = req.body;
  
      // Find the user by ID
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Check if the user has enough balance for the withdrawal
      if (user.balance[currency] < amount) {
        return res.status(400).json({ error: 'Insufficient balance for withdrawal' });
      }
  
      // Deduct the amount from the user's balance
      user.balance[currency] -= amount;
      await user.save();
  
      // Create a new Withdrawal record
      const withdrawal = new Withdrawal({
        userId,
        amount,
        currency,
        withdrawalAddress,
      });
  
      // Save the withdrawal record
      await withdrawal.save();
  
      res.status(200).json({
        message: 'Withdrawal request successfully processed',
        withdrawal,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
module.exports = router;
