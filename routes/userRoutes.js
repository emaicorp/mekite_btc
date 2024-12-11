const express = require("express");
const { registerUser, 
    loginUser, 
    verifyEmail, 
    getAccountBalance,
    makeDeposit, 
    requestWithdrawal,
    getReferralLink,
    getReferralStats,
    getAllPlans,
    choosePlan,
    getPlanStatus,
    getTransactionHistory } = require("../controller/userController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { getUserProfile } = require("../controller/userController"); // Ensure this path is correct

const router = express.Router();

// Register a new user
router.post("/register", registerUser);
router.post("/login", loginUser)
router.get("/verify-email/:token", verifyEmail);
router.get("/profile",authenticateToken, getUserProfile);
router.get("/balance", authenticateToken, getAccountBalance); // Get account balance
router.post("/deposit", authenticateToken, makeDeposit); // Make a deposit
router.post("/withdraw", authenticateToken, requestWithdrawal); // Request a withdrawal
router.get("/history", authenticateToken, getTransactionHistory); // Get transaction history
// Get Referral Link
router.get('/referral-link', authenticateToken, getReferralLink);

// View Referral Stats
router.get('/referrals', authenticateToken, getReferralStats);

// View All Plans
router.get('/plans', getAllPlans);

// Choose an Investment Plan
router.post('/choose-plan', authenticateToken, choosePlan);

// Track Plan Status
router.get('/plan-status/:planId', authenticateToken, getPlanStatus);
module.exports = router;
