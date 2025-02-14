const InvestmentService = require('../services/investmentService');
const UserService = require('../services/userService');
const EmailService = require('../services/emailService');
const Investment = require('../models/Investment');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Referral = require('../models/Referral');

class InvestmentController {
  static async createInvestment(req, res) {
    try {
      const { selectedPackage, paymentMethod, amount } = req.body;
      const userId = req.user.id;
      const user = await User.findById(userId)

     
      // Validate investment data
      const validationResult = await InvestmentService.validateInvestment(
        selectedPackage,
        paymentMethod,
        amount
      );

      if (!validationResult.isValid) {
        return res.status(400).json({ message: validationResult.message });
      }

      // Create investment
      const investment = await InvestmentService.createInvestment(
        userId,
        selectedPackage,
        paymentMethod,
        amount
      );

      // Send confirmation email
      await EmailService.sendInvestmentConfirmation(user, investment);

      res.status(201).json({
        success: true,
        message: 'Investment created successfully',
        investment
      });
    } catch (error) {
      console.error('Investment creation error:', error);
      res.status(500).json({ message: 'Server error during investment creation.' });
    }
  }

  static async getUserInvestments(req, res) {
    try {
      const userId = req.user.id;
      const investments = await InvestmentService.getUserInvestments(userId);

      res.status(200).json({
        success: true,
        investments
      });
    } catch (error) {
      console.error('Get investments error:', error);
      res.status(500).json({ message: 'Server error while fetching investments.' });
    }
  }

  static async getInvestmentPlans(req, res) {
    try {
      const plans = await InvestmentService.getInvestmentPlans();
      res.status(200).json({ success: true, plans });
    } catch (error) {
      console.error('Get plans error:', error);
      res.status(500).json({ message: 'Server error while fetching investment plans.' });
    }
  }

  static async updateInvestmentStatus(req, res) {
    try {
      const { investmentId } = req.params;
      const { status } = req.body;

      const investment = await InvestmentService.updateStatus(investmentId, status);
      const user = await User.findById(investment.userId);
        if (!user) {
          throw new Error('User not found');
        }
      // If investment is approved
      if (status === 'approved') {
        

        console.log(`Processing approval for investment ${investmentId}`);
        console.log(`Current active deposit for user ${user.username}: $${user.activeDeposit}`);
        
        // Update active deposit
        user.activeDeposit = (user.activeDeposit || 0) + investment.amount;

         if(investment.paymentMethod == 'balance'){
        await InvestmentService.deducBalance(user._id, investment.amount)
      }else{
        user.availableBalance = (user.availableBalance || 0) + investment.amount;
        
      }
      await user.save();
        console.log(`Updated active deposit to: $${user.activeDeposit}`);
        console.log(`✅ Investment approved and active deposit updated`);

        // Handle referral commission
        if (user.referredBy) {
          try {
            // Find referrer
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
              // Calculate 10% commission
              const commissionAmount = investment.amount * 0.10;
              console.log(`Calculating referral commission: $${commissionAmount} for referrer ${referrer.username}`);

              // Update referrer's available balance
              referrer.availableBalance = (referrer.availableBalance || 0) + commissionAmount;
              await referrer.save();

              // Update referral record with commission
              await Referral.findOneAndUpdate(
                { 
                  referrerId: referrer._id, 
                  referredId: user._id 
                },
                { 
                  $inc: { commission: commissionAmount },
                  status: 'active'  // Update status to active since they made an investment
                },
                { new: true }
              );

              // Create commission transaction
              await Transaction.create({
                userId: referrer._id,
                type: 'referral_commission',
                amount: commissionAmount,
                status: 'completed',
                description: `Referral commission from ${user.username}'s investment of $${investment.amount}`,
                currency: investment.paymentMethod
              });

              // Send email to referrer
              await EmailService.sendReferralCommissionNotification(
                referrer,
                {
                  amount: commissionAmount,
                  referredUser: user.username,
                  investmentAmount: investment.amount
                }
              );

              console.log(`✅ Referral commission processed and notification sent`);
            }
          } catch (error) {
            console.error('Error processing referral commission:', error);
            // Don't throw error to prevent blocking the main approval process
          }
        }

        // Send investment approval email
        await EmailService.sendInvestmentApproval(user, investment, status);
      }else{
        await EmailService.sendInvestmentApproval(user, investment, status);
      }

      res.status(200).json({
        success: true,
        message: 'Investment status updated successfully',
        investment
      });
    } catch (error) {
      console.error('Update investment status error:', error);
      res.status(500).json({ message: 'Server error while updating investment status.' });
    }
  }

  static async getAllInvestments(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const query = status ? { status } : {};
      
      const investments = await Investment.find(query)
        .populate('userId', 'username email fullName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Investment.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          investments,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteInvestment(req, res) {
    try {
      const { id } = req.params;
      
      const investment = await Investment.findById(id);
      if (!investment) {
        return res.status(404).json({
          success: false,
          message: 'Investment not found'
        });
      }

      // Remove investment reference from user
      await User.findByIdAndUpdate(
        investment.userId,
        { $pull: { investments: id } }
      );

      // Delete the investment
      await Investment.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Investment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = InvestmentController; 