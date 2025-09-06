const User = require('../models/User');
const config = require('../../../../../config/index');

class UserController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .select('-passwordHash -emailVerificationToken -passwordResetToken -tokenVersion');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const {
        firstName,
        lastName,
        bio,
        location,
        website,
        socialLinks
      } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        {
          $set: {
            'profile.firstName': firstName,
            'profile.lastName': lastName,
            'profile.bio': bio,
            'profile.location': location,
            'profile.website': website,
            'profile.socialLinks': socialLinks
          }
        },
        { 
          new: true, 
          runValidators: true 
        }
      ).select('-passwordHash -emailVerificationToken -passwordResetToken -tokenVersion');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  // Update user preferences
  async updatePreferences(req, res) {
    try {
      const {
        language,
        theme,
        codeEditor,
        notifications
      } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        {
          $set: {
            'preferences.language': language,
            'preferences.theme': theme,
            'preferences.codeEditor': codeEditor,
            'preferences.notifications': notifications
          }
        },
        { 
          new: true, 
          runValidators: true 
        }
      ).select('-passwordHash -emailVerificationToken -passwordResetToken -tokenVersion');

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences'
      });
    }
  }

  // Get user statistics
  async getStatistics(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Calculate additional statistics
      const acceptanceRate = user.progress.totalSubmissions > 0 
        ? Math.round((user.progress.acceptedSubmissions / user.progress.totalSubmissions) * 100)
        : 0;

      const statistics = {
        progress: user.progress,
        acceptanceRate,
        memberSince: user.createdAt,
        lastActive: user.lastLogin,
        subscription: user.subscription
      };

      res.json({
        success: true,
        data: { statistics }
      });

    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics'
      });
    }
  }

  // Upload avatar
  async uploadAvatar(req, res) {
    try {
      // This would integrate with a file upload service (AWS S3, Cloudinary, etc.)
      const avatarUrl = req.file ? req.file.path : null;
      
      if (!avatarUrl) {
        return res.status(400).json({
          success: false,
          message: 'No avatar file provided'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: { 'profile.avatar': avatarUrl } },
        { new: true }
      ).select('-passwordHash -emailVerificationToken -passwordResetToken -tokenVersion');

      res.json({
        success: true,
        message: 'Avatar updated successfully',
        data: { user }
      });

    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar'
      });
    }
  }

  // Delete user account
  async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify password for account deletion
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // Soft delete - mark as inactive
      user.isActive = false;
      user.email = `deleted_${Date.now()}_${user.email}`;
      user.username = `deleted_${Date.now()}_${user.username}`;
      await user.save();

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  }
}

module.exports = new UserController();
