const bcrypt = require("bcryptjs");
const User = require("../models/UserModels");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { fullname, username, email, password, confirmPassword, wallets, security, agree, role } = req.body;

  // Validate role
  const validRoles = ["user", "admin"];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role specified." });
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object
    const newUser = new User({
      fullname,
      username,
      email,
      password: hashedPassword,
      wallets,
      security,
      agree,
      role: role || "user", // Default to "user" if no role is specified
      referral: {
        referralLink: `https://yourapp.com/referral/${username}`, // Example auto-generated link
      },
    });

    // Save the user
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Error registering user", error });
  }
};

const loginUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role, // Include role in the token
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Return response
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        wallets: user.wallets,
        balance: user.balance,
        preferences: user.preferences,
        referral: user.referral,
        role: user.role, // Include role in the response
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verificationStatus.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Update the user's email verification status
    user.verificationStatus.emailVerified = true;
    await user.save();

    res.status(200).json({ message: "Email successfully verified" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};


// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -security.secretAnswer");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Account Balance
const getAccountBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); // Access the user ID from the token
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ activeBalance: user.balance.activeBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Make a Deposit
const makeDeposit = async (req, res) => {
  const { amount, paymentMethod, planId } = req.body;

  if (!amount || !paymentMethod || !planId) {
    return res.status(400).json({ message: "Amount, payment method, and plan ID are required" });
  }

  try {
    const user = await User.findById(req.user._id); // Access the user ID from the token
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the deposit amount to the user's balance
    user.balance.activeBalance += amount;
    user.balance.totalBalance += amount;

    // Save the updated user balance
    await user.save();

    // Add transaction history
    user.history.push({
      type: "deposit",
      amount,
      description: `Deposit of ${amount} using ${paymentMethod}`,
    });
    await user.save();

    res.status(200).json({ message: "Deposit successful", newBalance: user.balance.activeBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Request Withdrawal
const requestWithdrawal = async (req, res) => {
  const { amount, withdrawalMethod } = req.body;

  if (!amount || !withdrawalMethod) {
    return res.status(400).json({ message: "Amount and withdrawal method are required" });
  }

  try {
    const user = await User.findById(req.user._id); // Access the user ID from the token
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.balance.activeBalance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct the withdrawal amount from the user's balance
    user.balance.activeBalance -= amount;
    user.balance.totalBalance -= amount;

    // Save the updated user balance
    await user.save();

    // Add transaction history
    user.history.push({
      type: "withdrawal",
      amount,
      description: `Withdrawal of ${amount} via ${withdrawalMethod}`,
    });
    await user.save();

    res.status(200).json({ message: "Withdrawal successful", newBalance: user.balance.activeBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Transaction History
const getTransactionHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); // Access the user ID from the token
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ history: user.history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  getUserProfile,
  getAccountBalance,
  makeDeposit,
  requestWithdrawal,
  getTransactionHistory
};
