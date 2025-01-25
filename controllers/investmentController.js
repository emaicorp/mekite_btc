const InvestmentService = require('../services/investmentService');
const UserService = require('../services/userService');
const EmailService = require('../services/emailService');

class InvestmentController {
  static async createInvestment(req, res) {
    try {
      const { selectedPackage, paymentMethod, amount } = req.body;
      const userId = req.user.id;

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
      await EmailService.sendInvestmentConfirmation(req.user.email, investment);

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
      
      // If investment is approved, start profit calculation
      if (status === 'approved') {
        await InvestmentService.initiateProfitCalculation(investment);
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
}

module.exports = InvestmentController; 