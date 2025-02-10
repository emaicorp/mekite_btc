const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const AuthMiddleware = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, admin]
 *         walletAddress:
 *           type: string
 *         availableBalance:
 *           type: number
 *         totalEarnings:
 *           type: number
 *         activeDeposit:
 *           type: number
 *         status:
 *           type: string
 *           enum: [active, suspended, banned]
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, AdminController.getAllUsers);

/**
 * @swagger
 * /admin/manage-user:
 *   post:
 *     summary: Manage user account (suspend, ban, activate)
 *     tags: [Admin]
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
 *               - action
 *             properties:
 *               userId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [suspend, ban, activate]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 */
router.post('/manage-user', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, AdminController.manageUser);

/**
 * @swagger
 * /admin/currency-pendings:
 *   get:
 *     summary: Get all pending currency transactions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/currency-pendings', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, AdminController.getCurrencyPendings);

/**
 * @swagger
 * /admin/approve-currency/{userId}:
 *   post:
 *     summary: Approve a pending currency transaction
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - amount
 *               - currency
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction approved successfully
 *       404:
 *         description: Transaction not found
 */
router.post('/approve-currency/:userId', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, AdminController.approveCurrency);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
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
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, AdminController.deleteUser);

/**
 * @swagger
 * /admin/fund-active-deposit:
 *   put:
 *     summary: Fund user's active deposit
 *     tags: [Admin]
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
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Active deposit funded successfully
 *       404:
 *         description: User not found
 */
router.put('/fund-active-deposit', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, AdminController.fundActiveDeposit);

/**
 * @swagger
 * /admin/fund-total-earnings:
 *   put:
 *     summary: Fund user's total earnings
 *     tags: [Admin]
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
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Total earnings funded successfully
 *       404:
 *         description: User not found
 */
router.put('/fund-total-earnings', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, AdminController.fundTotalEarnings);

/**
 * @swagger
 * /admin/deduct-deposit:
 *   post:
 *     summary: Deduct from user's deposit
 *     tags: [Admin]
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
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deposit deducted successfully
 *       404:
 *         description: User not found
 *       400:
 *         description: Insufficient funds
 */
router.post('/deduct-deposit', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, AdminController.deductDeposit);

/**
 * @swagger
 * /admin/users/{userId}:
 *   patch:
 *     summary: Update user account details (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isSuspended:
 *                 type: boolean
 *               isDisabled:
 *                 type: boolean
 *               bitcoinAvailable:
 *                 type: number
 *               ethereumAvailable:
 *                 type: number
 *               usdtAvailable:
 *                 type: number
 *               activeDeposit:
 *                 type: number
 *               totalEarnings:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid update fields
 *       404:
 *         description: User not found
 */
router.patch('/users/:userId', 
  AuthMiddleware.authenticate, 
  AuthMiddleware.authorizeAdmin, 
  AdminController.manageUser
);

module.exports = router; 