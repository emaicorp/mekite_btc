const express = require('express');
const router = express.Router();
const InvestmentPlanController = require('../controllers/investmentPlanController');
const AuthMiddleware = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     InvestmentPlan:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - minAmount
 *         - maxAmount
 *         - dailyProfit
 *         - duration
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the investment plan
 *         description:
 *           type: string
 *           description: Detailed description of the plan
 *         minAmount:
 *           type: number
 *           description: Minimum investment amount
 *         maxAmount:
 *           type: number
 *           description: Maximum investment amount
 *         dailyProfit:
 *           type: number
 *           description: Daily profit percentage
 *         duration:
 *           type: number
 *           description: Investment duration in days
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           description: List of plan features
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Current status of the plan
 */

/**
 * @swagger
 * tags:
 *   name: Investment Plans
 *   description: Investment plan management
 */

/**
 * @swagger
 * /investment-plans:
 *   get:
 *     summary: Get all investment plans
 *     tags: [Investment Plans]
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
 */
router.get('/',  InvestmentPlanController.getAllPlans);

/**
 * @swagger
 * /investment-plans/{id}:
 *   get:
 *     summary: Get investment plan by ID
 *     tags: [Investment Plans]
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
 *         description: Investment plan details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvestmentPlan'
 */
router.get('/:id', AuthMiddleware.authenticate, InvestmentPlanController.getPlanById);

// Admin only routes
/**
 * @swagger
 * /investment-plans:
 *   post:
 *     summary: Create a new investment plan (Admin only)
 *     tags: [Investment Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvestmentPlan'
 *     responses:
 *       201:
 *         description: Investment plan created
 */
router.post('/', 
  AuthMiddleware.authenticate, 
  AuthMiddleware.authorizeAdmin, 
  InvestmentPlanController.createPlan
);

/**
 * @swagger
 * /investment-plans/{id}:
 *   put:
 *     summary: Update an investment plan (Admin only)
 *     tags: [Investment Plans]
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
 *             $ref: '#/components/schemas/InvestmentPlan'
 *     responses:
 *       200:
 *         description: Investment plan updated
 */
router.put('/:id', 
  AuthMiddleware.authenticate, 
  AuthMiddleware.authorizeAdmin, 
  InvestmentPlanController.updatePlan
);

/**
 * @swagger
 * /investment-plans/{id}:
 *   delete:
 *     summary: Delete an investment plan (Admin only)
 *     tags: [Investment Plans]
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
 *         description: Investment plan deleted
 */
router.delete('/:id', 
  AuthMiddleware.authenticate, 
  AuthMiddleware.authorizeAdmin, 
  InvestmentPlanController.deletePlan
);

/**
 * @swagger
 * /investment-plans/{id}/toggle-status:
 *   patch:
 *     summary: Toggle investment plan status (Admin only)
 *     tags: [Investment Plans]
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
 *         description: Investment plan status updated
 */
router.patch('/:id/toggle-status', 
  AuthMiddleware.authenticate, 
  AuthMiddleware.authorizeAdmin, 
  InvestmentPlanController.togglePlanStatus
);

module.exports = router; 