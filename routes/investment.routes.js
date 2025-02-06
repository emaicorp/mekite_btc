const express = require('express');
const router = express.Router();
const InvestmentController = require('../controllers/investmentController');
const AuthMiddleware = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Investment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Investment ID
 *         userId:
 *           type: string
 *           description: User ID who made the investment
 *         selectedPackage:
 *           type: string
 *           enum: [STARTER, ADVANCED, PREMIUM]
 *           description: Investment package type
 *         paymentMethod:
 *           type: string
 *           enum: [bitcoin, ethereum, usdt]
 *           description: Payment method used
 *         amount:
 *           type: number
 *           description: Investment amount
 *         status:
 *           type: string
 *           enum: [pending, approved, completed, cancelled]
 *           description: Current status of investment
 *         profit:
 *           type: number
 *           description: Current profit earned
 *         createdAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         transactionHash:
 *           type: string
 *           description: Blockchain transaction hash
 *     InvestmentPlan:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         minAmount:
 *           type: number
 *         maxAmount:
 *           type: number
 *         dailyProfit:
 *           type: number
 *         duration:
 *           type: number
 */

/**
 * @swagger
 * tags:
 *   name: Investments
 *   description: Investment management endpoints
 */

/**
 * @swagger
 * /investments:
 *   post:
 *     summary: Create a new investment
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selectedPackage
 *               - paymentMethod
 *               - amount
 *             properties:
 *               selectedPackage:
 *                 type: string
 *                 enum: [STARTER, ADVANCED, PREMIUM]
 *               paymentMethod:
 *                 type: string
 *                 enum: [bitcoin, ethereum, usdt]
 *               amount:
 *                 type: number
 *               transactionHash:
 *                 type: string
 *     responses:
 *       201:
 *         description: Investment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Invalid input or insufficient funds
 *       401:
 *         description: Unauthorized
 */
router.post('/', AuthMiddleware.authenticate, InvestmentController.createInvestment);

/**
 * @swagger
 * /investments/user:
 *   get:
 *     summary: Get user's investments
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, completed, cancelled]
 *         description: Filter by investment status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of user's investments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 investments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Investment'
 *                 totalCount:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/user', AuthMiddleware.authenticate, InvestmentController.getUserInvestments);

/**
 * @swagger
 * /investments/plans:
 *   get:
 *     summary: Get available investment plans
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of investment plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InvestmentPlan'
 *       401:
 *         description: Unauthorized
 */
router.get('/plans', AuthMiddleware.authenticate, InvestmentController.getInvestmentPlans);

/**
 * @swagger
 * /investments/{investmentId}/status:
 *   put:
 *     summary: Update investment status (Admin only)
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: investmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Investment ID
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
 *                 enum: [pending, approved, completed, cancelled]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Investment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Investment not found
 */
router.put('/:investmentId/status', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, InvestmentController.updateInvestmentStatus);

/**
 * @swagger
 * /investments/all:
 *   get:
 *     summary: Get all investments (Admin only)
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
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
 *         description: Investment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Investment not found
 */
router.get('/all', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, InvestmentController.getAllInvestments);

/**
 * @swagger
 * /investments/{id}:
 *   delete:
 *     summary: Delete an investment (Admin only)
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Investment ID
 *     responses:
 *       200:
 *         description: Investment deleted successfully
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Investment not found
 */
router.delete('/:id', AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin, InvestmentController.deleteInvestment);

module.exports = router; 