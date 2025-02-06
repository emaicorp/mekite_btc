const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const AuthMiddleware = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated user ID
 *         username:
 *           type: string
 *           description: Unique username
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         fullName:
 *           type: string
 *           description: User's full name
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *         walletAddress:
 *           type: object
 *           properties:
 *             bitcoin:
 *               type: string
 *             ethereum:
 *               type: string
 *             usdt:
 *               type: string
 *         availableBalance:
 *           type: number
 *           default: 0
 *         totalEarnings:
 *           type: number
 *           default: 0
 *         activeDeposit:
 *           type: number
 *           default: 0
 *         status:
 *           type: string
 *           enum: [active, suspended, banned]
 *           default: active
 *         isEmailVerified:
 *           type: boolean
 *           default: false
 *         referralCode:
 *           type: string
 *         referredBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and operations
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               fullName:
 *                 type: string
 *               referralCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user already exists
 */
router.post('/register', UserController.register);

/**
 * @swagger
 * /users/{userId}/balance:
 *   put:
 *     summary: Update user's balance
 *     tags: [Users]
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
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [add, subtract]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Balance updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/:userId/balance', AuthMiddleware.authenticate, UserController.updateBalance);

/**
 * @swagger
 * /users/{userId}/investments:
 *   post:
 *     summary: Add new investment for user
 *     tags: [Users]
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
 *               - planId
 *             properties:
 *               amount:
 *                 type: number
 *               planId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [bitcoin, ethereum, usdt]
 *     responses:
 *       201:
 *         description: Investment created successfully
 *       400:
 *         description: Invalid input or insufficient balance
 *       401:
 *         description: Unauthorized
 */
router.post('/:userId/investments', AuthMiddleware.authenticate, UserController.addInvestment);

// /**
//  * @swagger
//  * /users/referrals:
//  *   get:
//  *     summary: Get user's referrals
//  *     tags: [Users]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: List of user's referrals
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 type: object
//  *                 properties:
//  *                   username:
//  *                     type: string
//  *                   joinDate:
//  *                     type: string
//  *                     format: date-time
//  *                   status:
//  *                     type: string
//  *                   earnings:
//  *                     type: number
//  */
// router.get('/referrals', AuthMiddleware.authenticate, UserController.getReferrals);

// /**
//  * @swagger
//  * /users/wallet-address:
//  *   put:
//  *     summary: Update user's wallet address
//  *     tags: [Users]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - currency
//  *               - address
//  *             properties:
//  *               currency:
//  *                 type: string
//  *                 enum: [bitcoin, ethereum, usdt]
//  *               address:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Wallet address updated successfully
//  *       400:
//  *         description: Invalid input
//  *       401:
//  *         description: Unauthorized
//  */
// router.put('/wallet-address', AuthMiddleware.authenticate, UserController.updateWalletAddress);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user's complete information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.get('/me', AuthMiddleware.authenticate, UserController.getCurrentUser);

/**
 * @swagger
 * /users/update-profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               recoveryQuestion:
 *                 type: string
 *               recoveryAnswer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid updates or email/username already exists
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.patch('/update-profile', AuthMiddleware.authenticate, UserController.updateProfile);

// Admin routes
router.use(AuthMiddleware.authorizeAdmin);
// Add admin-specific routes here

module.exports = router;
