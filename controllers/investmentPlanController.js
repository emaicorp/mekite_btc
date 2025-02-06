const InvestmentPlanService = require('../services/investmentPlanService');

class InvestmentPlanController {
  static async createPlan(req, res) {
    try {
      const plan = await InvestmentPlanService.createPlan(req.body);
      res.status(201).json({
        success: true,
        data: plan
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getAllPlans(req, res) {
    try {
      const plans = await InvestmentPlanService.getAllPlans();
      res.status(200).json({
        success: true,
        data: plans
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getPlanById(req, res) {
    try {
      const plan = await InvestmentPlanService.getPlanById(req.params.id);
      res.status(200).json({
        success: true,
        data: plan
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updatePlan(req, res) {
    try {
      const isAdmin = req.user.role === 'admin';

      const plan = await InvestmentPlanService.updatePlan(
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        data: plan
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deletePlan(req, res) {
    try {
      await InvestmentPlanService.deletePlan(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Investment plan deleted successfully'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  static async togglePlanStatus(req, res) {
    try {
      const plan = await InvestmentPlanService.togglePlanStatus(req.params.id);
      res.status(200).json({
        success: true,
        data: plan
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = InvestmentPlanController; 