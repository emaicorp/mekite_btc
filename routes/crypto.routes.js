const express = require('express');
const router = express.Router();
const CryptoController = require('../controllers/cryptoController');

/**
 * @swagger
 * /crypto/chart:
 *   get:
 *     summary: Get cryptocurrency chart data
 *     tags: [Crypto]
 *     parameters:
 *       - in: query
 *         name: coinId
 *         schema:
 *           type: string
 *         default: bitcoin
 *         description: Cryptocurrency ID
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         default: usd
 *         description: Currency for price data
 *       - in: query
 *         name: days
 *         schema:
 *           type: string
 *         default: "1"
 *         description: Number of days of data
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/chart', CryptoController.getChartData);

// Optional: Add more crypto-related routes
router.get('/price/:coinId', CryptoController.getCurrentPrice);
router.get('/market-data', CryptoController.getMarketData);

module.exports = router; 