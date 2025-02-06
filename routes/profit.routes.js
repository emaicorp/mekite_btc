const express = require('express');
const router = express.Router();
const ProfitController = require('../controllers/profitController');
const AuthMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /profit/distribute:
 *   post:
 *     summary: Distribute daily profits to all active investments (Admin only)
 *     tags: [Profit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profits distributed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     successful:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     totalProfitDistributed:
 *                       type: number
 *       403:
 *         description: Admin access required
 */
router.post('/distribute', 
 
  ProfitController.distributeDailyProfits
);

/**
 * @swagger
 * /profit/statistics:
 *   get:
 *     summary: Get profit distribution statistics (Admin only)
 *     tags: [Profit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profit statistics retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/statistics', 
   
  ProfitController.getProfitStatistics
);

module.exports = router; 