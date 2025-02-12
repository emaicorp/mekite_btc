const express = require('express');
const router = express.Router();
const WithdrawalController = require('../controllers/withdrawalController');
const AuthMiddleware = require('../middleware/auth');

// User routes
router.post('/create', AuthMiddleware.authenticate, WithdrawalController.createWithdrawal);
router.get('/user', AuthMiddleware.authenticate, WithdrawalController.getUserWithdrawals);

// Admin routes
router.get('/admin/all', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WithdrawalController.getAllWithdrawals);
router.patch('/admin/:withdrawalId', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WithdrawalController.updateWithdrawalStatus);
router.delete('/admin/:withdrawalId', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WithdrawalController.deleteWithdrawal);

module.exports = router;