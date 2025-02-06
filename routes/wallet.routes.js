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
 * /wallet:
 *   post:
 *     summary: Create new wallet (Admin only)
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
 *               - currency
 *               - address
 *             properties:
 *               currency:
 *                 type: string
 *                 enum: [bitcoin, ethereum, usdt]
 *               address:
 *                 type: string
 *               label:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin access required
 */
router.post('/', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WalletController.createWallet);

/**
 * @swagger
 * /wallet:
 *   get:
 *     summary: Get all wallets 
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all wallets
 *       403:
 *         description: Admin access required
 */
router.get('/', AuthMiddleware.authenticate,  WalletController.getAllWallets);

/**
 * @swagger
 * /wallet/{currency}:
 *   get:
 *     summary: Get wallets by currency (Public)
 *     tags: [Wallet]
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *           enum: [bitcoin, ethereum, usdt]
 *     responses:
 *       200:
 *         description: List of wallets for specified currency
 */
router.get('/:currency', WalletController.getWalletsByCurrency);

/**
 * @swagger
 * /wallet/{id}:
 *   patch:
 *     summary: Update wallet (Admin only)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               label:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet updated successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Wallet not found
 */
router.patch('/:id', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WalletController.updateWallet);

/**
 * @swagger
 * /wallet/{id}:
 *   delete:
 *     summary: Delete wallet (Admin only)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet deleted successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Wallet not found
 */
router.delete('/:id', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, WalletController.deleteWallet);

module.exports = router; 