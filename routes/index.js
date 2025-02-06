const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const investmentRoutes = require('./investment.routes');
const walletRoutes = require('./wallet.routes');
const referralRoutes = require('./referral.routes');
const adminRoutes = require('./admin.routes');
const profileRoutes = require('./profile.routes');
const cryptoRoutes = require('./crypto.routes');
const investmentPlanRoutes = require('./investmentPlan.routes');
const usersRoutes = require('./userRoutes');
const transactionRoutes = require('./transaction.routes');

router.use('/auth', authRoutes);
router.use('/investments', investmentRoutes);
router.use('/wallet', walletRoutes);
router.use('/referrals', referralRoutes);
router.use('/admin', adminRoutes);
router.use('/profile', profileRoutes);
router.use('/crypto', cryptoRoutes);
router.use('/investment-plans', investmentPlanRoutes);
router.use('/users', usersRoutes);
router.use('/transactions', transactionRoutes);

module.exports = router; 