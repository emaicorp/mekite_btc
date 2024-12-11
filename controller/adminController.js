// const bcrypt = require("bcryptjs");
const User = require("../models/UserModels");


exports.getAllUsers = async (req, res) => {
    try {
      const { search, status } = req.query;
      const filter = {};
  
      if (status) {
        filter['accountStatus.isActive'] = status === 'active';
      }
  
      if (search) {
        filter['$or'] = [
          { fullname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ];
      }
  
      const users = await User.find(filter);
      res.status(200).json({ users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  // controllers/adminController.js
exports.getUserById = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  // controllers/adminController.js
exports.deleteUser = async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };

