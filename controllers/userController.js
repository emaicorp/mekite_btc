const UserService = require('../services/userService');

class UserController {
  static async register(req, res) {
    try {
      const userData = req.body;
      const user = await UserService.createUser(userData);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async updateBalance(req, res) {
    try {
      const { userId } = req.params;
      const balanceUpdates = req.body;
      const user = await UserService.updateBalance(userId, balanceUpdates);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async addInvestment(req, res) {
    try {
      const { userId } = req.params;
      const investmentData = req.body;
      const user = await UserService.addInvestment(userId, investmentData);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = UserController; 