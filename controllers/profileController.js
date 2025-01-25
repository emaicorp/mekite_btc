const ProfileService = require('../services/profileService');
const UserService = require('../services/userService');
const EmailService = require('../services/emailService');

class ProfileController {
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Validate email change if present
      if (updateData.email && updateData.email !== req.user.email) {
        await ProfileService.validateEmailChange(updateData.email);
      }

      const updatedProfile = await ProfileService.updateUserProfile(userId, updateData);

      // If email was changed, send confirmation
      if (updateData.email && updateData.email !== req.user.email) {
        await EmailService.sendEmailChangeConfirmation(updateData.email);
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error while updating profile.' });
    }
  }

  static async getActivity(req, res) {
    try {
      const userId = req.user.id;
      const activity = await ProfileService.getUserActivity(userId);

      res.status(200).json({
        success: true,
        activity
      });
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({ message: 'Server error while fetching activity.' });
    }
  }

  static async getStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await ProfileService.getUserStats(userId);

      res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ message: 'Server error while fetching stats.' });
    }
  }
}

module.exports = ProfileController; 