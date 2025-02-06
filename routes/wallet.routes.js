const express = require('express');
const router = express.Router();
const WalletController = require('../controllers/walletController');
const AuthMiddleware = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Wallet:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Wallet ID
 *         userId:
 *           type: string
 *           description: User ID who owns the wallet
 *         balance:
 *           type: number
 *           description: Current wallet balance
 *         currency:
 *           type: string
 *           enum: [USD, BTC, ETH, USDT]
 *         addresses:
 *           type: object
 *           properties:
 *             bitcoin:
 *               type: string
 *             ethereum:
 *               type: string
 *             usdt:
 *               type: string
 *         isLocked:
 *           type: boolean
 *           description: Whether the wallet is locked for transactions
 *     Transaction:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [deposit, withdrawal, investment, referral]
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *         transactionHash:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management and transactions
 */

/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: Get user's wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [USD, BTC, ETH, USDT]
 *         description: Currency type for balance
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Not authorized
 */
router.get('/balance', AuthMiddleware.authenticate, WalletController.getBalance);

/**
 * @swagger
 * /wallet/update-balance:
 *   put:
 *     summary: Update wallet balance (Admin only)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [credit, debit]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Balance updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.put('/update-balance', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WalletController.updateBalance);

/**
 * @swagger
 * /wallet/withdraw:
 *   post:
 *     summary: Request a withdrawal
 *     tags: [Wallet]
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
 *                 minimum: 10
 *               currency:
 *                 type: string
 *                 enum: [BTC, ETH, USDT]
 *               walletAddress:
 *                 type: string
 *     responses:
 *       201:
 *         description: Withdrawal request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input or insufficient balance
 *       401:
 *         description: Not authorized
 */
router.post('/withdraw', AuthMiddleware.authenticate, WalletController.requestWithdrawal);

/**
 * @swagger
 * /wallet/fund:
 *   post:
 *     summary: Fund wallet (Admin only)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *               - currency
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [USD, BTC, ETH, USDT]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.post('/fund', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WalletController.fundWallet);

/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: Get wallet transactions history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, investment, referral]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *         description: Filter by transaction status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 totalCount:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Not authorized
 */
router.get('/transactions', AuthMiddleware.authenticate, WalletController.getTransactions);

/**
 * @swagger
 * /wallet/addresses:
 *   put:
 *     summary: Update wallet addresses
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bitcoin:
 *                 type: string
 *               ethereum:
 *                 type: string
 *               usdt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet addresses updated successfully
 *       400:
 *         description: Invalid addresses
 *       401:
 *         description: Not authorized
 */
router.put('/addresses', AuthMiddleware.authenticate, WalletController.updateAddresses);

module.exports = router; 