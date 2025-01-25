const express = require('express');
const router = express.Router();
const ReferralController = require('../controllers/referralController');
const AuthMiddleware = require('../middleware/auth');

router.use(AuthMiddleware.authenticate);

// Referral routes
router.post('/', ReferralController.processReferral);
router.get('/commission', ReferralController.getReferralCommission);
router.post('/commission', ReferralController.updateCommission);
router.get('/list', ReferralController.getUserReferrals);

module.exports = router; 