const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middleware/auth');

// Verify all controller methods exist before using them
if (!AuthController.register) console.error('register method is undefined');
if (!AuthController.login) console.error('login method is undefined');
if (!AuthController.forgotPassword) console.error('forgotPassword method is undefined');
if (!AuthController.resetPassword) console.error('resetPassword method is undefined');
if (!AuthController.changePassword) console.error('changePassword method is undefined');
if (!AuthController.verifyToken) console.error('verifyToken method is undefined');

// Public routes
router.post('/register', (req, res) => AuthController.register(req, res));
router.post('/login', (req, res) => AuthController.login(req, res));
router.post('/forgot-password', (req, res) => AuthController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => AuthController.resetPassword(req, res));

// Protected routes (require authentication)
router.use(AuthMiddleware.authenticate);
router.get('/verify', (req, res) => AuthController.verifyToken(req, res));
router.post('/change-password', (req, res) => AuthController.changePassword(req, res));

module.exports = router; 