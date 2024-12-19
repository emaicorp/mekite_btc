const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer')
// const path = require('path'); // For referencing image file paths
const sendEmail  = require('../emailUtils');
const User = require('../models/UserModels'); // Import User model
const authenticateUser = require('../middleware/authMiddleware');
const Investment = require('../models/Investment'); // Ensure Investment schema is correctly imported
const authMiddleware = require('../middleware/authMiddleware');
const Wallet = require('../models/UserWalletSchema')
const Message = require("../models/MessageSchema")
// const dashboardMessage = User.getDashboardMessage();

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

    // Validate wallets input
    if (wallets && typeof wallets !== 'object') {
      return res.status(400).json({ message: 'Invalid wallets format.' });
    }

    // Hash the password and secret answer
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecretAnswer = await bcrypt.hash(secretAnswer, 10);

    // Create the user (let the schema handle wallet address generation)
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
    const emailSubject = 'Registration Successful - Wallet Address';
    const emailText = `
      Welcome, ${fullname}!
      
      Congratulations on registering with our platform.
      Your generated wallet address is: ${savedUser.walletAddress}

      Please keep it secure and use it for your transactions.
    `;

    const emailHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; background-color: #f4f7fa; padding: 20px; }
            .container { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            h2 { color: #4CAF50; text-align: center; }
            p { font-size: 16px; margin: 10px 0; }
            .wallet { font-size: 18px; font-weight: bold; color: #007BFF; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome, ${fullname}!</h2>
            <p>Congratulations on successfully registering with our platform. Below is your generated wallet address:</p>
            <p class="wallet">${savedUser.walletAddress}</p>
            <p>Please keep it secure and use it for your transactions.</p>
            <p>Thank you for choosing us!</p>
          </div>
        </body>
      </html>
    `;

    // Send email with wallet address
    try {
      await sendEmail(email, emailSubject, emailText, emailHtml);
      console.log('Welcome email sent successfully!');
    } catch (emailError) {
      console.error('Failed to send email:', emailError.message);
    }

    res.status(201).json({
      message: 'User registered successfully, and wallet address has been sent to your email.',
      user: {
        fullname: savedUser.fullname,
        username: savedUser.username,
        email: savedUser.email,
        walletAddress: savedUser.walletAddress, // Ensure wallet address is returned
      },
    });
  } catch (error) {
    console.error('Error in /register endpoint:', error.message);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});


router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found', style: 'error' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials', style: 'error' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, roles: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Check roles and customize response
    const dashboardMessage = user.roles.includes('admin')
      ? 'Welcome Admin! You have access to the Admin Dashboard.'
      : 'Welcome User! You have access to the User Dashboard.';

    return res.json({
      message: 'Login successful! You are now logged in.',
      style: 'success',
      token,
      user,
      dashboardMessage,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', style: 'error' });
  }
});

// 1. GET endpoint to fetch user details by username or email
router.get("/user/details", async (req, res) => {
  try {
    const { username, email } = req.query;

    // Validate input
    if (!username && !email) {
      return res
        .status(400)
        .json({ message: "Username or Email is required to fetch user details" });
    }

    // Find user by username or email
    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user details
    res.json({
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      wallets: user.wallets,
      balance: user.balance,
      totalEarnings: user.totalEarnings,
      activities: user.activities.slice(0, 5), // Return only the latest 5 activities
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: Update user details
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { fullname, username, email, wallets, security } = req.body;

    // Ensure the user is authenticated
    const userId = req.user.id; // Assuming the auth middleware attaches user info

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user fields if they are provided
    if (fullname) user.fullname = fullname;
    if (username) user.username = username;
    if (email) user.email = email;
    if (wallets) user.wallets = wallets; // Wallet addresses can be updated
    if (security) user.security = security; // Update secret question/answer

    // Save the updated user
    await user.save();

    res.status(200).json({ message: 'User details updated successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password: Validate email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Email validated. You may now reset your password.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset Password: Update the password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Password reset successfully.' });
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

// POST endpoint for user withdrawal
router.post('/withdraw', async (req, res) => {
  try {
    const { userId, currency, amount } = req.body;

    // Validate the request
    if (!userId || !currency || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if the currency is valid
    const validCurrencies = ['usdt', 'ethereum', 'bitcoin'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({ success: false, message: 'Invalid currency' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the user has sufficient balance
    if (user.balance[currency] < amount) {
      return res.status(400).json({ success: false, message: `Insufficient ${currency} balance` });
    }

    // Create a pending withdrawal request
    user.withdrawals.push({
      amount,
      currency,
      status: 'pending',
    });

    // Save the user with the pending withdrawal
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully. Pending admin approval.',
      withdrawal: {
        currency,
        amount,
        status: 'pending',
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin approves or rejects a withdrawal request
router.post('/approve-withdrawal', async (req, res) => {
  try {
    const { userId, withdrawalId, status } = req.body;

    // Validate request
    if (!userId || !withdrawalId || !['completed', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid request data' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the pending withdrawal
    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal || withdrawal.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Withdrawal not found or already processed' });
    }

    // Process the withdrawal
    if (status === 'completed') {
      if (user.balance[withdrawal.currency] < withdrawal.amount) {
        return res.status(400).json({ success: false, message: `Insufficient ${withdrawal.currency} balance` });
      }

      // Deduct the amount from the user's balance
      user.balance[withdrawal.currency] -= withdrawal.amount;
    }

    // Update the withdrawal status
    withdrawal.status = status;

    // Save the user
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Withdrawal ${status} successfully`,
      withdrawal,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

  router.get('/user/history/:username', async (req, res) => {
    const { username } = req.params;
    console.log("Received username:", username); // Log the username to check the parameter value
  
    try {
      const user = await User.findOne({ username });
  
      if (!user) {
        console.log("User not found:", username); // Log if user is not found
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Extract user history data
      const history = {
        fullname: user.fullname,
        username: user.username,
        email: user.email, // Include email
        balance: user.getBalance(),
        deposits: user.deposits,
        withdrawals: user.withdrawals,
        activities: user.activities,
        totalEarnings: user.getTotalEarnings(),
      };
  
      return res.status(200).json({
        message: 'User history fetched successfully',
        history,
      });
    } catch (error) {
      console.error('Error fetching user history:', error.message);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
// Middleware to fetch user by username
const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Helper function for amount validation
const validateAmount = (amount) => {
  return typeof amount === 'number' && amount > 0;
};

// Mock conversion rates for currency
const currencyRates = {
  usdt: 1,
  ethereum: 2500, // 1 ETH = $2500
  bitcoin: 30000, // 1 BTC = $30,000
};

// POST: Add or reinvest in an investment plan
router.post('/:username/invest', getUser, async (req, res) => {
  const { plan, amount, currency } = req.body;

  // Input Validation
  if (!['STARTER', 'CRYPTO PLAN', 'ADVANCED PLAN', 'PAY PLAN', 'PREMIUM PLAN'].includes(plan)) {
    return res.status(400).json({ message: 'Invalid investment plan' });
  }

  if (!['usdt', 'ethereum', 'bitcoin'].includes(currency)) {
    return res.status(400).json({ message: 'Invalid currency' });
  }

  if (!validateAmount(amount)) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  // Optional: Define minimum investment amounts for plans
  const minInvestment = {
    STARTER: 50,
    'CRYPTO PLAN': 100,
    'ADVANCED PLAN': 200,
    'PAY PLAN': 500,
    'PREMIUM PLAN': 1000,
  };

  if (amount < minInvestment[plan]) {
    return res.status(400).json({
      message: `Minimum investment for ${plan} is ${minInvestment[plan]} USD`,
    });
  }

  try {
    // Convert the amount to USD using currency rates (if not in USDT)
    const amountInUSD = amount * currencyRates[currency];

    // Add or reinvest in the plan
    await req.user.addOrReinvestInvestment(plan, amountInUSD, currency);

    // Calculate the total investment amount
    const totalInvestment = req.user.investments.reduce((total, inv) => total + inv.amount, 0);

    res.status(201).json({
      message: `Investment in ${plan} updated successfully`,
      investments: req.user.investments,
      totalInvestment: `${totalInvestment} USD`,
    });
  } catch (err) {
    res.status(500).json({ message: 'Investment failed: ' + err.message });
  }
});

// GET: Fetch user investments
router.get('/:username/investments', getUser, (req, res) => {
  const totalInvestment = req.user.investments.reduce((total, inv) => total + inv.amount, 0);
  res.status(200).json({
    investments: req.user.investments,
    totalInvestment: `${totalInvestment} USD`,
  });
});

// Endpoint: Update user wallet by username
router.put('/user/update-wallet/:username', async (req, res) => {
  const { username } = req.params;
  const { bitcoin, ethereum, usdt } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update wallet addresses
    user.wallets.bitcoin = bitcoin || user.wallets.bitcoin;
    user.wallets.ethereum = ethereum || user.wallets.ethereum;
    user.wallets.usdt = usdt || user.wallets.usdt;

    // Save the updated user data
    await user.save();

    return res.status(200).json({
      message: 'Wallet updated successfully',
      user,
    });
  } catch (error) {
    console.error('Error updating wallet:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


// admin
// GET endpoint to retrieve all users
router.get('/admin/users', async (req, res) => {
  try {
    // Fetch all users and populate all details
    const users = await User.find();

    // Send the user data as a response
    return res.status(200).json({
      success: true,
      message: 'All users retrieved successfully',
      data: users,
    });
  } catch (error) {
    // Handle any errors
    console.error('Error fetching users:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving users',
      error: error.message,
    });
  }
});

// Endpoint to delete a specific user by user ID
router.delete('/admin/users/:userId', async (req, res) => {
  try {
    // Extract the userId from the request params
    const { userId } = req.params;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete the user
    await user.remove();

    // Send success response
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    // Handle any errors
    console.error('Error deleting user:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the user',
      error: error.message,
    });
  }
});

// POST endpoint to save or update wallet addresses
router.post("/api/wallets", async (req, res) => {
  try {
    const { email, bitcoinAddress, ethereumAddress, usdtAddress } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Find user by email
    let user = await Wallet.findOne({ email });

    if (!user) {
      // Create a new record if user doesn't exist
      user = new Wallet({
        email,
        bitcoinAddress: bitcoinAddress || null,
        ethereumAddress: ethereumAddress || null,
        usdtAddress: usdtAddress || null
      });
      await user.save();
      return res.status(201).json({
        message: "Wallet details saved successfully.",
        data: user
      });
    }

    // Update existing user details
    user.bitcoinAddress = bitcoinAddress || user.bitcoinAddress;
    user.ethereumAddress = ethereumAddress || user.ethereumAddress;
    user.usdtAddress = usdtAddress || user.usdtAddress;

    await user.save();

    return res.status(200).json({
      message: "Wallet details updated successfully.",
      data: user
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error occurred." });
  }
});

// GET endpoint to retrieve wallet details by email
router.get("/api/wallets/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const user = await Wallet.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Wallet details retrieved successfully.",
      data: user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error occurred." });
  }
});

// Endpoint to get user wallet details by email
router.get("/api/wallets", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "User email is required." });
    }

    // Fetch user wallet details
    const user = await Wallet.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User wallet details not found." });
    }

    return res.status(200).json({
      message: "User wallet details retrieved successfully.",
      data: {
        email: user.email,
        bitcoinAddress: user.bitcoinAddress,
        ethereumAddress: user.ethereumAddress,
        usdtAddress: user.usdtAddress,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error occurred." });
  }
});

// POST: Save user message
router.post("/api/messages/send", async (req, res) => {
  try {
    const { firstName, lastName, phone, email, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !email || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Create a new message entry
    const newMessage = new Message({
      firstName,
      lastName,
      phone,
      email,
      message
    });

    // Save the message to the database
    await newMessage.save();

    return res.status(201).json({
      message: "Your message has been sent successfully.",
      data: newMessage
    });
  } catch (error) {
    console.error("Error saving message:", error);
    return res.status(500).json({ message: "Server error occurred." });
  }
});

// GET: Admin retrieves messages by email
router.get("/api/messages/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Find messages by email
    const messages = await Message.find({ email });

    if (messages.length === 0) {
      return res.status(404).json({ message: "No messages found for this email." });
    }

    return res.status(200).json({
      message: "Messages retrieved successfully.",
      data: messages
    });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return res.status(500).json({ message: "Server error occurred." });
  }
});

// Admin funding endpoint
// router.post('/admin/fund-user', async (req, res) => {
//   try {
//     const { walletAddress, amount, currency } = req.body;

//     // Input validation
//     if (!walletAddress || !amount || !currency) {
//       return res.status(400).json({ message: "Wallet address, amount, and currency are required." });
//     }

//     if (!['usdt', 'ethereum', 'bitcoin'].includes(currency)) {
//       return res.status(400).json({ message: "Invalid currency type. Use 'usdt', 'ethereum', or 'bitcoin'." });
//     }

//     if (amount <= 0) {
//       return res.status(400).json({ message: "Amount must be greater than zero." });
//     }

//     // Find the user by wallet address
//     const user = await User.findOne({ walletAddress });

//     if (!user) {
//       return res.status(404).json({ message: "User not found with the provided wallet address." });
//     }

//     // Update user's balance
//     user.balance[currency] += amount;

//     // Add an activity log
//     await user.addActivity(`Admin funded ${amount} ${currency.toUpperCase()} to your account.`);

//     // Save updated user data
//     await user.save();

//     return res.status(200).json({
//       message: `Successfully funded ${amount} ${currency.toUpperCase()} to user.`,
//       user: {
//         fullname: user.fullname,
//         walletAddress: user.walletAddress,
//         balance: user.getBalance(),
//       },
//     });
//   } catch (err) {
//     console.error("Error funding user:", err);
//     return res.status(500).json({ message: "An error occurred while funding the user.", error: err.message });
//   }
// });

router.post('/admin/fund-user', async (req, res) => {
  try {
    const { walletAddress, amount, currency } = req.body;

    // Input validation
    if (!walletAddress || !amount || !currency) {
      return res.status(400).json({ message: "Wallet address, amount, and currency are required." });
    }

    if (!['usdt', 'ethereum', 'bitcoin'].includes(currency)) {
      return res.status(400).json({ message: "Invalid currency type. Use 'usdt', 'ethereum', or 'bitcoin'." });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero." });
    }

    // Validate custom wallet address format
    const isValidWallet = /^[a-z0-9]{32}$/.test(walletAddress);
    if (!isValidWallet) {
      return res.status(400).json({ message: "Invalid custom wallet address format." });
    }

    // Find the user by wallet address
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ message: "User not found with the provided wallet address." });
    }

    // Validate and update user's balance
    if (!user.balance || typeof user.balance[currency] !== 'number') {
      return res.status(400).json({ message: "User's balance structure is invalid or incomplete." });
    }
    user.balance[currency] += amount;

    // Add an activity log
    await user.addActivity(`Admin funded ${amount} ${currency.toUpperCase()} to your account.`);

    // Save updated user data
    await user.save();

    // Send the response to the client
    res.status(200).json({
      message: `Successfully funded ${amount} ${currency.toUpperCase()} to user.`,
      user: {
        fullname: user.fullname,
        walletAddress: user.walletAddress,
        balance: user.getBalance(),
      },
    });

    // Prepare email details
    const emailSubject = 'Funds Deposited';
    const emailHtml = `
      <p>Dear ${user.fullname},</p>
      <p>Your account has been credited with <strong>${amount} ${currency.toUpperCase()}</strong>.</p>
      <p>Thank you,<br>Admin</p>
    `;

    // Send email notification
    try {
      await sendEmail(user.email, emailSubject, "", emailHtml);
      console.log("Email sent successfully.");
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
    }

  } catch (err) {
    console.error("Error funding user:", err);
    res.status(500).json({ message: "An error occurred while funding the user.", error: err.message });
  }
});

// Get user balance
router.get("/user/balance/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch balance, active deposits, withdrawals, and earnings
    const balance = user.getBalance();
    const activeDeposits = user.getActiveDeposits().reduce((sum, d) => sum + d.amount, 0);
    const totalWithdrawals = user.withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalEarnings = user.getTotalEarnings();

    res.json({
      balance,
      activeDeposit: activeDeposits,
      totalWithdrawals,
      earningTotal: totalEarnings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Endpoint for users to fund their account
router.post("/fund", async (req, res) => {
  const { walletAddress, amount, currency } = req.body;

  try {
    // Validate the request
    if (!walletAddress || !amount || !currency) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find the user by wallet address
    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({ message: "User not found with the given wallet address." });
    }

    // Create a new deposit request
    const newDeposit = {
      amount,
      currency,
      status: "active", // Start as pending admin approval
    };

    user.deposits.push(newDeposit);

    // Log the activity
    await user.addActivity(`Created a funding request for ${amount} ${currency}`);

    // Save the user with the new deposit
    await user.save();

    return res.status(201).json({ message: "Funding request created successfully." });
  } catch (error) {
    console.error("Error creating funding request:", error);
    return res.status(500).json({ message: "An error occurred. Please try again later." });
  }
});

// Endpoint for admin to approve funding
router.post("/approve-fund", async (req, res) => {
  const { depositId, walletAddress } = req.body;

  try {
    // Validate the request
    if (!depositId || !walletAddress) {
      return res.status(400).json({ message: "Deposit ID and wallet address are required." });
    }

    // Find the user by wallet address
    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({ message: "User not found with the given wallet address." });
    }

    // Find the deposit
    const deposit = user.deposits.id(depositId);

    if (!deposit || deposit.status !== "active") {
      return res.status(404).json({ message: "Deposit not found or already processed." });
    }

    // Approve the deposit
    deposit.status = "completed";
    user.balance[deposit.currency] += deposit.amount; // Update the user's balance

    // Log the activity
    await user.addActivity(
      `Admin approved funding of ${deposit.amount} ${deposit.currency}`
    );

    // Save the user
    await user.save();

    return res.status(200).json({ message: "Funding approved successfully." });
  } catch (error) {
    console.error("Error approving funding:", error);
    return res.status(500).json({ message: "An error occurred. Please try again later." });
  }
});

// Endpoint to get all pending deposits for admin approval
router.get("/admin/deposits/pending", async (req, res) => {
  try {
    // Fetch all users with pending deposits
    const users = await User.find({ "deposits.status": "active" });

    // Extract pending deposits with user details
    const pendingDeposits = users.flatMap((user) =>
      user.deposits
        .filter((deposit) => deposit.status === "active")
        .map((deposit) => ({
          userId: user._id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress,
          depositId: deposit._id,
          amount: deposit.amount,
          currency: deposit.currency,
          createdAt: deposit.createdAt,
        }))
    );

    return res.status(200).json({ pendingDeposits });
  } catch (error) {
    console.error("Error fetching pending deposits:", error);
    return res.status(500).json({ message: "An error occurred. Please try again later." });
  }
});

// Endpoint to approve or reject a deposit
router.post("/admin/deposits/:depositId/approve", async (req, res) => {
  const { depositId } = req.params;
  const { status } = req.body; // `completed` or `cancelled`

  try {
    // Validate status
    if (!["completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use 'completed' or 'cancelled'." });
    }

    // Find the user with the deposit
    const user = await User.findOne({ "deposits._id": depositId });

    if (!user) {
      return res.status(404).json({ message: "Deposit not found." });
    }

    // Find the specific deposit
    const deposit = user.deposits.id(depositId);

    if (!deposit) {
      return res.status(404).json({ message: "Deposit not found." });
    }

    // Update the deposit status
    deposit.status = status;

    // If approved, update the user's balance
    if (status === "completed") {
      user.balance[deposit.currency] += deposit.amount;

      // Log the activity
      await user.addActivity(`Admin approved deposit of ${deposit.amount} ${deposit.currency}.`);
    } else {
      // Log the rejection
      await user.addActivity(`Admin rejected deposit of ${deposit.amount} ${deposit.currency}.`);
    }

    // Save the user with the updated deposit
    await user.save();

    return res.status(200).json({ message: `Deposit ${status} successfully.` });
  } catch (error) {
    console.error("Error approving/rejecting deposit:", error);
    return res.status(500).json({ message: "An error occurred. Please try again later." });
  }
});

module.exports = router;
