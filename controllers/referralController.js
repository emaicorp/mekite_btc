const ReferralService = require('../services/referralService');
const UserService = require('../services/userService');
const EmailService = require('../services/emailService');
const Referral = require('../models/Referral');
const User = require('../models/User');
const ReferralCommission = require('../models/ReferralCommission');

class ReferralController {
  static async processReferral(req, res) {
    try {
      const { referralCode } = req.body;
      const referredUser = req.user.id;

      // Check if user already has a referrer
      const existingReferral = await Referral.findOne({ referredId: referredUser });
      if (existingReferral) {
        return res.status(400).json({
          success: false,
          message: 'User already has a referrer'
        });
      }

      // Find referrer by referral code
      const referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(404).json({
          success: false,
          message: 'Invalid referral code'
        });
      }

      // Create new referral
      const referral = await Referral.create({
        referrerId: referrer._id,
        referredId: referredUser,
        status: 'pending'
      });

      res.status(201).json({
        success: true,
        data: referral
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getReferralCommission(req, res) {
    try {
      const commissionStructure = await ReferralCommission.find()
        .sort({ level: 1 });

      res.json({
        success: true,
        data: commissionStructure
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateCommission(req, res) {
    try {
      const commissionData = req.body;

      // Validate commission data
      if (!Array.isArray(commissionData)) {
        return res.status(400).json({
          success: false,
          message: 'Commission data must be an array'
        });
      }

      // Clear existing commission structure
      await ReferralCommission.deleteMany({});

      // Create new commission structure
      const commissionStructure = await ReferralCommission.create(commissionData);

      res.json({
        success: true,
        data: commissionStructure
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getUserReferrals(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const query = { referrerId: req.user.id };

      if (status) {
        query.status = status;
      }

      const referrals = await Referral.find(query)
        .populate('referredId', 'username createdAt totalInvestment')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const totalCount = await Referral.countDocuments(query);
      const totalCommission = await Referral.aggregate([
        { $match: { referrerId: req.user._id } },
        { $group: { _id: null, total: { $sum: '$commission' } } }
      ]);

      const formattedReferrals = referrals.map(ref => ({
        referredUser: {
          username: ref.referredId.username,
          joinDate: ref.referredId.createdAt,
          totalInvestment: ref.referredId.totalInvestment
        },
        commission: ref.commission,
        status: ref.status,
        createdAt: ref.createdAt
      }));

      res.json({
        success: true,
        data: {
          referrals: formattedReferrals,
          totalCount,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCommission: totalCommission[0]?.total || 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getReferralStats(req, res) {
    try {
      const totalReferrals = await Referral.countDocuments({ referrerId: req.user.id });
      const activeReferrals = await Referral.countDocuments({ 
        referrerId: req.user.id,
        status: 'active'
      });
      const commissionStats = await Referral.aggregate([
        { $match: { referrerId: req.user._id } },
        { $group: {
          _id: null,
          totalCommission: { $sum: '$commission' },
          pendingCommission: {
            $sum: {
              $cond: [{ $eq: ['$commissionPaid', false] }, '$commission', 0]
            }
          }
        }}
      ]);

      const user = await User.findById(req.user.id);

      res.json({
        success: true,
        data: {
          totalReferrals,
          activeReferrals,
          totalCommission: commissionStats[0]?.totalCommission || 0,
          pendingCommission: commissionStats[0]?.pendingCommission || 0,
          referralLink: `${process.env.APP_URL}/register?ref=${user.referralCode}`
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ReferralController; 