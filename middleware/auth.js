const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthMiddleware {
  static async authenticate(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (user.isDisabled || user.isSuspended) {
        return res.status(403).json({ message: 'Account is disabled or suspended' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  }

  static authorizeAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  }
}

module.exports = AuthMiddleware; 