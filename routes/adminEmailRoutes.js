const express = require('express');
const router = express.Router();
const AdminEmailController = require('../controllers/adminEmailController');
const AuthMiddleware = require('../middleware/auth');

// All routes require admin authentication
router.use(AuthMiddleware.authenticate, AuthMiddleware.authorizeAdmin);

// Routes
router.post('/add', AdminEmailController.addEmail);
router.get('/', AdminEmailController.getAllEmails);
router.delete('/:emailId', AdminEmailController.deleteEmail);
router.patch('/:emailId/toggle', AdminEmailController.toggleEmailStatus);

module.exports = router; 