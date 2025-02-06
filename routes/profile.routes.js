const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const AuthMiddleware = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         username:
 *           type: string
 *           description: User's username
 *         email:
 *           type: string
 *           format: email
 *         fullName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         country:
 *           type: string
 *         walletAddresses:
 *           type: object
 *           properties:
 *             bitcoin:
 *               type: string
 *             ethereum:
 *               type: string
 *             usdt:
 *               type: string
 *         referralCode:
 *           type: string
 *         referralLink:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, suspended, banned]
 *         lastLogin:
 *           type: string
 *           format: date-time
 *     ProfileUpdate:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         country:
 *           type: string
 *         walletAddresses:
 *           type: object
 *           properties:
 *             bitcoin:
 *               type: string
 *             ethereum:
 *               type: string
 *             usdt:
 *               type: string
 */

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Profile not found
 */
router.get('/', AuthMiddleware.authenticate, ProfileController.getProfile);

/**
 * @swagger
 * /profile/update:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdate'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.put('/update', AuthMiddleware.authenticate, ProfileController.updateProfile);

/**
 * @swagger
 * /profile/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Current password incorrect
 */
router.post('/change-password', AuthMiddleware.authenticate, ProfileController.changePassword);

/**
 * @swagger
 * /profile/activity:
 *   get:
 *     summary: Get user activity history
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [login, investment, withdrawal, deposit, referral]
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: Activity history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                 totalCount:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get('/activity', AuthMiddleware.authenticate, ProfileController.getActivity);

/**
 * @swagger
 * /profile/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalInvestments:
 *                   type: number
 *                 activeInvestments:
 *                   type: number
 *                 totalEarnings:
 *                   type: number
 *                 pendingWithdrawals:
 *                   type: number
 *                 totalReferrals:
 *                   type: number
 *                 referralEarnings:
 *                   type: number
 */
router.get('/stats', AuthMiddleware.authenticate, ProfileController.getStats);

/**
 * @swagger
 * /profile/verify-email:
 *   post:
 *     summary: Send email verification link
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       400:
 *         description: Email already verified
 */
router.post('/verify-email', AuthMiddleware.authenticate, ProfileController.sendVerificationEmail);

/**
 * @swagger
 * /profile/verify-email/{token}:
 *   get:
 *     summary: Verify email with token
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email/:token', ProfileController.verifyEmail);

module.exports = router; 