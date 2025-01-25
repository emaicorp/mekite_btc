const express = require('express');
const router = express.Router();
const InvestmentController = require('../controllers/investmentController');
const AuthMiddleware = require('../middleware/auth');

router.use(AuthMiddleware.authenticate);

// Investment routes
router.post('/', InvestmentController.createInvestment);
router.get('/user', InvestmentController.getUserInvestments);
router.get('/plans', InvestmentController.getInvestmentPlans);
router.put('/:investmentId/status', AuthMiddleware.authorizeAdmin, InvestmentController.updateInvestmentStatus);

module.exports = router; 