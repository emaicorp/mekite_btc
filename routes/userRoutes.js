const express = require("express");
const { registerUser, loginUser, verifyEmail } = require("../controller/userController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { getUserProfile } = require("../controller/userController"); // Ensure this path is correct

const router = express.Router();

// Register a new user
router.post("/register", registerUser);
router.post("/login", loginUser)
router.get("/verify-email/:token", verifyEmail);
router.get("/profile",authenticateToken, getUserProfile);

module.exports = router;
