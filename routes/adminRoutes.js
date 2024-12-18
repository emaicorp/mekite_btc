const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin"); // Import Admin schema
const router = express.Router();

// Admin registration endpoint
router.post("/admin/register", async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;

    // Validate input
    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "Fullname, email, and password are required." });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin with this email already exists." });
    }

    // Create a new admin
    const newAdmin = new Admin({ fullname, email, password, role });
    await newAdmin.save();

    return res.status(201).json({
      message: "Admin registered successfully.",
      admin: {
        id: newAdmin._id,
        fullname: newAdmin.fullname,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Error registering admin:", error);
    return res.status(500).json({ message: "An error occurred while registering the admin." });
  }
});

router.post("/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }
  
      // Find admin by email
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(404).json({ message: "Admin not found." });
      }
  
      // Compare password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET, // Add your JWT secret in environment variables
        { expiresIn: "7d" }
      );
  
      return res.status(200).json({
        message: "Login successful.",
        token,
        admin: {
          id: admin._id,
          fullname: admin.fullname,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("Error logging in admin:", error);
      return res.status(500).json({ message: "An error occurred while logging in." });
    }
  });
  
  module.exports = router;
