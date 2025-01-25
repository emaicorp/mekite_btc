const ReferralService = require('../services/referralService');
const UserService = require('../services/userService');
const EmailService = require('../services/emailService');

class ReferralController {
  static async processReferral(req, res) {
    try {
      const { referralCode, newUserId } = req.body;

      const result = await ReferralService.processNewReferral(referralCode, newUserId);

      if (result.referrer) {
        // Send email notification to referrer
        await EmailService.sendReferralNotification(result.referrer.email, {
          referredUser: result.referredUser.username,
          commission: result.commission
        });
      }

      res.status(200).json({
        success: true,
        message: 'Referral processed successfully',
        data: result
      });
    } catch (error) {
      console.error('Process referral error:', error);
      res.status(500).json({ message: 'Server error while processing referral.' });
    }
  }

  static async getReferralCommission(req, res) {
    try {
      const userId = req.user.id;
      const commissionData = await ReferralService.getUserCommissions(userId);

      res.status(200).json({
        success: true,
        data: commissionData
      });
    } catch (error) {
      console.error('Get commission error:', error);
      res.status(500).json({ message: 'Server error while fetching commission data.' });
    }
  }

  static async updateCommission(req, res) {
    try {
      const { referralId, commission } = req.body;
      const userId = req.user.id;

      const updatedReferral = await ReferralService.updateReferralCommission(
        userId,
        referralId,
        commission
      );

      res.status(200).json({
        success: true,
        message: 'Commission updated successfully',
        data: updatedReferral
      });
    } catch (error) {
      console.error('Update commission error:', error);
      res.status(500).json({ message: 'Server error while updating commission.' });
    }
  }

  static async getUserReferrals(req, res) {
    try {
      const userId = req.user.id;
      const referrals = await ReferralService.getUserReferralList(userId);

      res.status(200).json({
        success: true,
        data: referrals
      });
    } catch (error) {
      console.error('Get referrals error:', error);
      res.status(500).json({ message: 'Server error while fetching referrals.' });
    }
  }
}

module.exports = ReferralController; 