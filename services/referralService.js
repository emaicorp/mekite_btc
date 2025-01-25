const User = require('../models/User');

class ReferralService {
  static async processNewReferral(referralCode, newUserId) {
    try {
      const referrer = await User.findOne({ referralLink: referralCode });
      if (!referrer) throw new Error('Invalid referral code');

      const referredUser = await User.findById(newUserId);
      if (!referredUser) throw new Error('New user not found');

      // Calculate commission (example: 5% of initial deposit)
      const commission = referredUser.activeDeposit * 0.05;

      // Update referrer's referrals
      referrer.referrals.push({
        referredBy: referredUser.username,
        status: 'active',
        commission
      });

      // Update referrer's earnings
      referrer.totalEarnings += commission;

      await referrer.save();

      return {
        referrer,
        referredUser,
        commission
      };
    } catch (error) {
      throw new Error(`Error processing referral: ${error.message}`);
    }
  }

  static async getUserCommissions(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const totalCommission = user.referrals.reduce(
        (sum, ref) => sum + ref.commission,
        0
      );

      return {
        referrals: user.referrals,
        totalCommission
      };
    } catch (error) {
      throw new Error(`Error fetching commissions: ${error.message}`);
    }
  }

  static async updateReferralCommission(userId, referralId, commission) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const referral = user.referrals.id(referralId);
      if (!referral) throw new Error('Referral not found');

      const oldCommission = referral.commission;
      referral.commission = commission;

      // Update total earnings
      user.totalEarnings += (commission - oldCommission);

      await user.save();
      return referral;
    } catch (error) {
      throw new Error(`Error updating commission: ${error.message}`);
    }
  }

  static async getUserReferralList(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      return {
        referrals: user.referrals,
        totalReferrals: user.referrals.length,
        activeReferrals: user.referrals.filter(ref => ref.status === 'active').length
      };
    } catch (error) {
      throw new Error(`Error fetching referral list: ${error.message}`);
    }
  }
}

module.exports = ReferralService; 