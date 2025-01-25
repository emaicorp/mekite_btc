const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const AuthMiddleware = require('../middleware/auth');

router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.authorizeAdmin);

// Admin routes
router.get('/users', AdminController.getAllUsers);
router.post('/manage-user', AdminController.manageUser);
router.get('/currency-pendings', AdminController.getCurrencyPendings);
router.post('/approve-currency/:userId', AdminController.approveCurrency);
router.delete('/users/:id', AdminController.deleteUser);
router.put('/fund-active-deposit', AdminController.fundActiveDeposit);
router.put('/fund-total-earnings', AdminController.fundTotalEarnings);
router.post('/deduct-deposit', AdminController.deductDeposit);

module.exports = router; 