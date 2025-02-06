const ProfitService = require('../services/profitService');

class ProfitController {
  static async distributeDailyProfits(req, res) {
    try {
      const results = await ProfitService.calculateAndDistributeDailyProfits();
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getProfitStatistics(req, res) {
    try {
      const stats = await ProfitService.getProfitStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ProfitController; 