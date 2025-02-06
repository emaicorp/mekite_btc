const InvestmentPlan = require('../models/InvestmentPlan');

class InvestmentPlanService {
  static async createPlan(planData) {
    try {
      const plan = new InvestmentPlan(planData);
      await plan.save();
      return plan;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Plan with this name already exists');
      }
      throw error;
    }
  }

  static async getAllPlans(includeInactive = false) {
    const query = { isDeleted: false };
    if (!includeInactive) {
      query.status = 'active';
    }
    return await InvestmentPlan.find(query).sort({ minAmount: 1 });
  }

  static async getPlanById(planId) {
    const plan = await InvestmentPlan.findOne({
      _id: planId,
      isDeleted: false
    });
    if (!plan) {
      throw new Error('Investment plan not found');
    }
    return plan;
  }

  static async updatePlan(planId, updateData) {
    const plan = await InvestmentPlan.findOneAndUpdate(
      { _id: planId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );
    if (!plan) {
      throw new Error('Investment plan not found');
    }
    return plan;
  }

  static async deletePlan(planId) {
    const plan = await InvestmentPlan.findOneAndUpdate(
      { _id: planId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!plan) {
      throw new Error('Investment plan not found');
    }
    return plan;
  }

  static async togglePlanStatus(planId) {
    const plan = await InvestmentPlan.findOne({
      _id: planId,
      isDeleted: false
    });
    if (!plan) {
      throw new Error('Investment plan not found');
    }
    
    plan.status = plan.status === 'active' ? 'inactive' : 'active';
    await plan.save();
    return plan;
  }
}

module.exports = InvestmentPlanService; 