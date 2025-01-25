const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const AuthMiddleware = require('../middleware/auth');

// Public routes
router.post('/register', UserController.register);

// Protected routes
router.use(AuthMiddleware.authenticate);
router.put('/:userId/balance', UserController.updateBalance);
router.post('/:userId/investments', UserController.addInvestment);

// Admin routes
router.use(AuthMiddleware.authorizeAdmin);
// Add admin-specific routes here

module.exports = router;

module.exports = router;
