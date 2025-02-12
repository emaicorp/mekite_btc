const AdminEmailService = require('../services/adminEmailService');

const AdminEmailController = {
  addEmail: async (req, res) => {
    try {
      const { email, description } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an email address'
        });
      }

      const newEmail = await AdminEmailService.addEmail({
        email,
        description
      });

      res.status(201).json({
        success: true,
        message: 'Admin email added successfully',
        data: newEmail
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  getAllEmails: async (req, res) => {
    try {
      const emails = await AdminEmailService.getAllEmails();

      res.json({
        success: true,
        data: emails
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  deleteEmail: async (req, res) => {
    try {
      const { emailId } = req.params;
      
      await AdminEmailService.deleteEmail(emailId);

      res.json({
        success: true,
        message: 'Admin email deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  toggleEmailStatus: async (req, res) => {
    try {
      const { emailId } = req.params;
      
      const email = await AdminEmailService.toggleEmailStatus(emailId);

      res.json({
        success: true,
        message: `Email ${email.isActive ? 'activated' : 'deactivated'} successfully`,
        data: email
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = AdminEmailController; 