const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const AuthMiddleware = require('../middleware/auth');

router.use(AuthMiddleware.authenticate);

// Profile routes
router.put('/update', ProfileController.updateProfile);
router.get('/activity', ProfileController.getActivity);
router.get('/stats', ProfileController.getStats);

module.exports = router; 