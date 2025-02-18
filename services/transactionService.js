const Transaction = require('../models/Transaction');
const User = require('../models/User');
const EmailService = require('./emailService');

class TransactionService {
  static async getAllTransactions(filters = {}, page = 1, limit = 10) {
    try {
      const query = {};
      
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      
      const skip = (page - 1) * limit;
      
      const transactions = await Transaction.find(query)
        .populate('userId', 'username email fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Transaction.countDocuments(query);

      return {
        transactions,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }
  }

  static async getTransactionById(id) {
    try {
      const transaction = await Transaction.findById(id)
        .populate('userId', 'username email fullName');
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error) {
      throw new Error(`Error fetching transaction: ${error.message}`);
    }
  }

  static async updateTransactionStatus(id, status, remarks) {
    try {
      const transaction = await Transaction.findById(id)
        .populate('userId', 'email fullName');

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      transaction.status = status;
      if (remarks) transaction.remarks = remarks;
      transaction.processedAt = new Date();

      await transaction.save();

      // Send email notification to user
      await EmailService.sendTransactionUpdate(transaction.userId, transaction);

      return transaction;
    } catch (error) {
      throw new Error(`Error updating transaction: ${error.message}`);
    }
  }

  static async getTransactionStats() {
    try {
      const stats = await Transaction.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      throw new Error(`Error getting transaction stats: ${error.message}`);
    }
  }

  static async getUserTransactions(userId, filters = {}, pagination = {}) {
    try {
      const { type, status } = filters;
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      // Build query
      const query = { userId };
      if (type) query.type = type;
      if (status) query.status = status;

      // Get total count for pagination
      const total = await Transaction.countDocuments(query);

      // Get transactions with pagination
      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email');

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      };
    } catch (error) {
      throw new Error(`Error fetching user transactions: ${error.message}`);
    }
  }
}

module.exports = TransactionService;