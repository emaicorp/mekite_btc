const express = require('express');
const router = express.Router();
const ReferralController = require('../controllers/referralController');
const AuthMiddleware = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Referral:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Referral ID
 *         referrerId:
 *           type: string
 *           description: ID of user who referred
 *         referredId:
 *           type: string
 *           description: ID of referred user
 *         status:
 *           type: string
 *           enum: [pending, active, completed]
 *           description: Current status of referral
 *         commission:
 *           type: number
 *           description: Commission earned from referral
 *         commissionPaid:
 *           type: boolean
 *           description: Whether commission has been paid
 *         createdAt:
 *           type: string
 *           format: date-time
 *     ReferralCommission:
 *       type: object
 *       properties:
 *         level:
 *           type: number
 *           description: Referral level (1, 2, 3)
 *         percentage:
 *           type: number
 *           description: Commission percentage
 *         minInvestment:
 *           type: number
 *           description: Minimum investment required
 */

/**
 * @swagger
 * tags:
 *   name: Referrals
 *   description: Referral system management
 */

/**
 * @swagger
 * /referral:
 *   post:
 *     summary: Process a new referral
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referralCode
 *             properties:
 *               referralCode:
 *                 type: string
 *                 description: Referral code of the referrer
 *     responses:
 *       201:
 *         description: Referral processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Referral'
 *       400:
 *         description: Invalid referral code or user already referred
 *       404:
 *         description: Referrer not found
 */
router.post('/', AuthMiddleware.authenticate, ReferralController.processReferral);

/**
 * @swagger
 * /referral/commission:
 *   get:
 *     summary: Get referral commission structure
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Commission structure retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReferralCommission'
 */
router.get('/commission', AuthMiddleware.authenticate, ReferralController.getReferralCommission);

/**
 * @swagger
 * /referral/commission:
 *   post:
 *     summary: Update referral commission structure (Admin only)
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - level
 *                 - percentage
 *               properties:
 *                 level:
 *                   type: number
 *                 percentage:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 100
 *                 minInvestment:
 *                   type: number
 *     responses:
 *       200:
 *         description: Commission structure updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.post('/commission', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, ReferralController.updateCommission);

/**
 * @swagger
 * /referral/list:
 *   get:
 *     summary: Get user's referrals
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed]
 *         description: Filter by referral status
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of referrals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 referrals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       referredUser:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                           joinDate:
 *                             type: string
 *                             format: date-time
 *                           totalInvestment:
 *                             type: number
 *                       commission:
 *                         type: number
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 totalCount:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalCommission:
 *                   type: number
 *       401:
 *         description: Not authorized
 */
router.get('/list', AuthMiddleware.authenticate, ReferralController.getUserReferrals);

/**
 * @swagger
 * /referral/stats:
 *   get:
 *     summary: Get referral statistics
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalReferrals:
 *                   type: integer
 *                 activeReferrals:
 *                   type: integer
 *                 totalCommission:
 *                   type: number
 *                 pendingCommission:
 *                   type: number
 *                 referralLink:
 *                   type: string
 */
router.get('/stats', AuthMiddleware.authenticate, ReferralController.getReferralStats);

module.exports = router; 