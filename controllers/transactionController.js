const TransactionService = require('../services/transactionService');

class TransactionController {
  static async getAllTransactions(req, res) {
    try {
      const { type, status, page = 1, limit = 10 } = req.query;
      const filters = { type, status };
      
      const result = await TransactionService.getAllTransactions(filters, page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getTransactionById(req, res) {
    try {
      const transaction = await TransactionService.getTransactionById(req.params.id);
      
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateTransactionStatus(req, res) {
    try {
      const { status, remarks } = req.body;
      const transaction = await TransactionService.updateTransactionStatus(
        req.params.id,
        status,
        remarks
      );
      
      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getUserTransactions(req, res) {
    try {
      const { type, status, page = 1, limit = 10 } = req.query;
      const userId = req.user.id;

      const result = await TransactionService.getUserTransactions(
        userId,
        { type, status },
        { page: parseInt(page), limit: parseInt(limit) }
      );

      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get user transactions error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = TransactionController; 