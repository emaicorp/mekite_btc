const WalletService = require('../services/walletService');
const EmailService = require('../services/emailService');

class WalletController {
  static async updateBalance(req, res) {
    try {
      const { walletAddress, currency, balanceChange, isWithdrawal } = req.body;

      // Validate request
      if (!walletAddress || !currency || balanceChange === undefined || isWithdrawal === undefined) {
        return res.status(400).json({ 
          message: 'Wallet address, currency, balance change, and withdrawal status are required.' 
        });
      }

      const result = await WalletService.updateBalance(
        walletAddress,
        currency,
        balanceChange,
        isWithdrawal
      );

      // Send email notification
      if (!isWithdrawal) {
        await EmailService.sendDepositConfirmation(result.user.email, {
          amount: balanceChange,
          currency,
          newBalance: result.newBalance
        });
      }

      res.status(200).json({
        message: `${isWithdrawal ? 'Withdrawal' : 'Deposit'} successful.`,
        ...result
      });
    } catch (error) {
      console.error('Balance update error:', error);
      res.status(500).json({ message: 'Server error during balance update.' });
    }
  }

  static async requestWithdrawal(req, res) {
    try {
      const { currency, amount } = req.body;
      const userId = req.user.id;

      const withdrawal = await WalletService.createWithdrawalRequest(
        userId,
        currency,
        amount
      );

      res.status(200).json({
        message: 'Withdrawal request submitted successfully.',
        withdrawal
      });
    } catch (error) {
      console.error('Withdrawal request error:', error);
      res.status(500).json({ message: 'Server error during withdrawal request.' });
    }
  }

  static async getBalance(req, res) {
    try {
      const userId = req.user.id;
      const balance = await WalletService.getUserBalance(userId);

      res.status(200).json({ success: true, balance });
    } catch (error) {
      console.error('Get balance error:', error);
      res.status(500).json({ message: 'Server error while fetching balance.' });
    }
  }

  static async fundWallet(req, res) {
    try {
      const { userId, currency, amount } = req.body;

      const result = await WalletService.fundUserWallet(userId, currency, amount);
      
      res.status(200).json({
        message: 'Wallet funded successfully',
        ...result
      });
    } catch (error) {
      console.error('Fund wallet error:', error);
      res.status(500).json({ message: 'Server error during wallet funding.' });
    }
  }
}

module.exports = WalletController; 