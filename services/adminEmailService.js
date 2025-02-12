const AdminEmail = require('../models/AdminEmail');

class AdminEmailService {
  static async addEmail(emailData) {
    try {
      const email = await AdminEmail.create(emailData);
      return email;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      throw new Error(`Error adding email: ${error.message}`);
    }
  }

  static async getAllEmails() {
    try {
      return await AdminEmail.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching emails: ${error.message}`);
    }
  }

  static async deleteEmail(emailId) {
    try {
      const email = await AdminEmail.findByIdAndDelete(emailId);
      
      if (!email) {
        throw new Error('Email not found');
      }

      return { message: 'Email deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting email: ${error.message}`);
    }
  }

  static async toggleEmailStatus(emailId) {
    try {
      const email = await AdminEmail.findById(emailId);
      
      if (!email) {
        throw new Error('Email not found');
      }

      email.isActive = !email.isActive;
      await email.save();

      return email;
    } catch (error) {
      throw new Error(`Error toggling email status: ${error.message}`);
    }
  }
}

module.exports = AdminEmailService; 