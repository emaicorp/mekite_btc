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

module.exports = {
  registerUser,
  loginUser,
};
