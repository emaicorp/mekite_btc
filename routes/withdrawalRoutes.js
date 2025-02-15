const express = require('express');
const router = express.Router();
const WithdrawalController = require('../controllers/withdrawalController');
const AuthMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /withdrawals/create:
 *   post:
 *     summary: Create a new withdrawal request
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - walletAddress
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [BTC, ETH, USDT]
 *               walletAddress:
 *                 type: string
 *     responses:
 *       201:
 *         description: Withdrawal request created successfully
 *       400:
 *         description: Invalid input or insufficient balance
 *       401:
 *         description: Unauthorized
 */
router.post('/create', AuthMiddleware.authenticate, WithdrawalController.createWithdrawal);

/**
 * @swagger
 * /withdrawals/user:
 *   get:
 *     summary: Get user's withdrawal requests
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's withdrawals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       status:
 *                         type: string
 *                       walletAddress:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/user', AuthMiddleware.authenticate, WithdrawalController.getUserWithdrawals);

/**
 * @swagger
 * /withdrawals/user/{withdrawalId}:
 *   delete:
 *     summary: Delete user's pending withdrawal request
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: withdrawalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the withdrawal to delete
 *     responses:
 *       200:
 *         description: Withdrawal request deleted successfully
 *       400:
 *         description: Cannot delete processed withdrawal
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Withdrawal not found
 */
router.delete('/user/:withdrawalId', AuthMiddleware.authenticate, WithdrawalController.deleteUserWithdrawal);

// Admin routes
router.get('/admin/all', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WithdrawalController.getAllWithdrawals);
router.patch('/admin/:withdrawalId', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WithdrawalController.updateWithdrawalStatus);
router.delete('/admin/:withdrawalId', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WithdrawalController.deleteWithdrawal);

module.exports = router;