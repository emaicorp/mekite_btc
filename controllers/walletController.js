const WalletService = require('../services/walletService');
const EmailService = require('../services/emailService');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

class WalletController {
  static async createWallet(req, res) {
    try {
      const wallet = await WalletService.createWallet(req.body);
      res.status(201).json({
        success: true,
        data: wallet
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getAllWallets(req, res) {
    try {
      const wallets = await WalletService.getAllWallets();
      res.json({
        success: true,
        data: wallets
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getWalletsByCurrency(req, res) {
    try {
      const wallets = await WalletService.getWalletsByCurrency(req.params.currency);
      res.json({
        success: true,
        data: wallets
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateWallet(req, res) {
    try {
      const wallet = await WalletService.updateWallet(req.params.id, req.body);
      res.json({
        success: true,
        data: wallet
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteWallet(req, res) {
    try {
      await WalletService.deleteWallet(req.params.id);
      res.json({
        success: true,
        message: 'Wallet deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

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
      const wallet = await Wallet.findOne({ userId: req.user.id });
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      res.json({
        success: true,
        data: {
          balance: wallet.balance,
          currency: wallet.currency,
          lastUpdated: wallet.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async fundWallet(req, res) {
    try {
      const { userId, amount, currency, note } = req.body;
      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      wallet.balance += amount;
      await wallet.save();

      const transaction = await Transaction.create({
        userId,
        type: 'deposit',
        amount,
        currency,
        status: 'completed',
        description: note || `Admin funding of ${amount} ${currency}`
      });

      res.json({
        success: true,
        data: {
          wallet,
          transaction
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getTransactions(req, res) {
    try {
      const { type, status, page = 1, limit = 10 } = req.query;
      const query = { userId: req.user.id };

      if (type) query.type = type;
      if (status) query.status = status;

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const totalCount = await Transaction.countDocuments(query);

      res.json({
        success: true,
        data: {
          transactions,
          totalCount,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateAddresses(req, res) {
    try {
      const { bitcoin, ethereum, usdt } = req.body;
      const wallet = await Wallet.findOne({ userId: req.user.id });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      wallet.addresses = {
        ...wallet.addresses,
        ...(bitcoin && { bitcoin }),
        ...(ethereum && { ethereum }),
        ...(usdt && { usdt })
      };

      await wallet.save();

      res.json({
        success: true,
        data: wallet
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getAdminWallets(req, res) {
    try {
      const wallets = await WalletService.getAdminWallets();
      res.json({
        success: true,
        data: wallets
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateAdminWallet(req, res) {
    try {
      const { currency, address } = req.body;
      const result = await WalletService.updateAdminWallet(currency, address);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteAdminWallet(req, res) {
    try {
      const { currency } = req.query;
      const result = await WalletService.deleteAdminWallet(currency);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = WalletController; 