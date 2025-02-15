const WithdrawalService = require('../services/withdrawalService');

const WithdrawalController = {
  createWithdrawal: async (req, res) => {
    try {
      const { amount, currency, walletAddress } = req.body;

      if (!amount || !currency || !walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields'
        });
      }

      const withdrawal = await WithdrawalService.createWithdrawal(req.user.id, {
        amount,
        currency,
        walletAddress
      });

      res.status(201).json({
        success: true,
        message: 'Withdrawal request created successfully',
        data: withdrawal
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  updateWithdrawalStatus: async (req, res) => {
    try {
      const { withdrawalId } = req.params;
      const { status, remarks } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const withdrawal = await WithdrawalService.updateWithdrawalStatus(
        withdrawalId,
        status,
        remarks
      );

      res.json({
        success: true,
        message: `Withdrawal ${status} successfully`,
        data: withdrawal
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  getUserWithdrawals: async (req, res) => {
    try {
      const withdrawals = await WithdrawalService.getUserWithdrawals(req.user.id);
      
      res.json({
        success: true,
        data: withdrawals
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  getAllWithdrawals: async (req, res) => {
    try {
      const withdrawals = await WithdrawalService.getAllWithdrawals();
      
      res.json({
        success: true,
        data: withdrawals
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  deleteWithdrawal: async (req, res) => {
    try {
      const { withdrawalId } = req.params;

      await WithdrawalService.deleteWithdrawal(withdrawalId);

      res.json({
        success: true,
        message: 'Withdrawal deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  deleteUserWithdrawal: async (req, res) => {
    try {
      const { withdrawalId } = req.params;
      const userId = req.user.id;

      const withdrawal = await WithdrawalService.getUserWithdrawal(withdrawalId, userId);
      
      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message: 'Withdrawal not found'
        });
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete a processed withdrawal'
        });
      }

      await WithdrawalService.deleteWithdrawal(withdrawalId);

      res.json({
        success: true,
        message: 'Withdrawal request deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = WithdrawalController; 