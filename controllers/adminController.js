const AdminService = require('../services/adminService');
const UserService = require('../services/userService');
const EmailService = require('../services/emailService');

class AdminController {
  static async getAllUsers(req, res) {
    try {
      const users = await AdminService.getAllUsers();
      res.status(200).json({ success: true, users });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Server error while fetching users.' });
    }
  }

  static async manageUser(req, res) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'No update data provided' 
        });
      }

      const user = await AdminService.manageUserAccount(
        req.params.userId, 
        req.body
      );
      const {username, email, status, role, password} = req.body
      // Send notification email to user
      await EmailService.sendAccountStatusNotification(user.email,
        username,
        email,
        status,
        role,
        password
        
      );

      res.status(200).json({
        success: true,
        message: `User Data updated  successfully`,
        user: user
      });
    } catch (error) {
      console.error('Manage user error:', error);
      res.status(500).json({ message: 'Server error while managing user.' });
    }
  }

  static async getCurrencyPendings(req, res) {
    try {
      const pendings = await AdminService.getPendingTransactions();
      res.status(200).json({ success: true, pendings });
    } catch (error) {
      console.error('Get pendings error:', error);
      res.status(500).json({ message: 'Server error while fetching pending transactions.' });
    }
  }

  static async approveCurrency(req, res) {
    try {
      const { userId } = req.params;
      const { currency, amount } = req.body;

      const result = await AdminService.approveCurrencyTransaction(userId, currency, amount);

      // Send approval notification
      await EmailService.sendTransactionApprovalNotification(result.user.email, {
        currency,
        amount
      });

      res.status(200).json({
        success: true,
        message: 'Currency approved successfully',
        data: result
      });
    } catch (error) {
      console.error('Approve currency error:', error);
      res.status(500).json({ message: 'Server error while approving currency.' });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await AdminService.deleteUser(id);
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Server error while deleting user.' });
    }
  }

  static async fundActiveDeposit(req, res) {
    try {
      const { userId, amount } = req.body;
      const result = await AdminService.updateActiveDeposit(userId, amount);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Fund active deposit error:', error);
      res.status(500).json({ message: 'Server error while funding active deposit.' });
    }
  }

  static async fundTotalEarnings(req, res) {
    try {
      const { userId, amount } = req.body;
      const result = await AdminService.updateTotalEarnings(userId, amount);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Fund total earnings error:', error);
      res.status(500).json({ message: 'Server error while funding total earnings.' });
    }
  }

  static async deductDeposit(req, res) {
    try {
      const { userId, amount } = req.body;
      const result = await AdminService.deductFromDeposit(userId, amount);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Deduct deposit error:', error);
      res.status(500).json({ message: 'Server error while deducting deposit.' });
    }
  }
}

module.exports = AdminController;