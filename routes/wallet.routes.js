const express = require('express');
const router = express.Router();
const WalletController = require('../controllers/walletController');
const AuthMiddleware = require('../middleware/auth');

router.use(AuthMiddleware.authenticate);

// Wallet routes
router.put('/update-balance', WalletController.updateBalance);
router.post('/withdraw', WalletController.requestWithdrawal);
router.get('/balance', WalletController.getBalance);
router.post('/fund', AuthMiddleware.authorizeAdmin, WalletController.fundWallet);

module.exports = router; 