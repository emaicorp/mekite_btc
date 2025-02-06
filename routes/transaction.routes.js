const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const AuthMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions (Admin)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, investment, referral, profit]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, TransactionController.getAllTransactions);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get transaction by ID (Admin)
 *     tags: [Transactions]
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
 *         description: Transaction details
 */
router.get('/:id', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, TransactionController.getTransactionById);

/**
 * @swagger
 * /transactions/{id}/status:
 *   patch:
 *     summary: Update transaction status (Admin)
 *     tags: [Transactions]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, failed, cancelled]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction status updated
 */
router.patch('/:id/status', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, TransactionController.updateTransactionStatus);

module.exports = router; 