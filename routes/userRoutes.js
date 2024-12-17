const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail  = require('../emailUtils');
const User = require('../models/UserModels'); // Import User model
const authenticateUser = require('../middleware/authMiddleware');
const Investment = require('../models/Investment'); // Ensure Investment schema is correctly imported
const authMiddleware = require('../middleware/authMiddleware');

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
  try {
    const { email, username, password } = req.body;

    if (!(email || username) || !password) {
      return res.status(400).json({
        message: 'Please provide an email or username along with the password.',
        style: 'error',
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email or username. Please check your credentials or register.',
        style: 'error',
      });
    }

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'The password you entered is incorrect. Please try again.',
        style: 'error',
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, roles: user.roles }, 'your_jwt_secret', { expiresIn: '1h' });

    // Remove password from the response
    const { password: _, ...userDetails } = user.toObject();

    res.status(200).json({
      message: 'Login successful! You are now logged in.',
      style: 'success',
      token,
      user: userDetails,
    });
  } catch (error) {
    console.error('Error in /login endpoint:', error.message);
    res.status(500).json({
      message: `An unexpected error occurred. Please try again later.`,
      style: 'error',
    });
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

// Endpoint: Update wallet details for logged-in user
router.put('/update-profile', authenticateUser, async (req, res) => {
  const { bitcoin, ethereum, usdt } = req.body;

  try {
    // Ensure the user is authenticated
    const userId = req.user._id; // Get the user ID from the token

    // Find the user and update their wallet details
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "wallets.bitcoin": bitcoin,
          "wallets.ethereum": ethereum,
          "wallets.usdt": usdt,
        },
      },
      { new: true } // Return the updated user document
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      user, // Return the updated user details
    });
  } catch (error) {
    console.error('Error updating wallet:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
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

// Endpoint: Get user history by username
router.get('/user/history/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract user history data
    const history = {
      fullname: user.fullname,
      username: user.username,
      balance: user.getBalance(),
      deposits: user.deposits,
      withdrawals: user.withdrawals,
      activities: user.activities,
      totalEarnings: user.getTotalEarnings(),
    };

    // Return the user's history
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

module.exports = router;
