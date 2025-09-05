const User = require('../models/User');
const config = require('../../../../../config/index');

class PasswordController {
  // Request password reset
  async requestReset(req, res) {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // TODO: Send reset email (will implement email service later)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        success: true,
        message: 'Password reset link sent to your email',
        // Remove token from response in production
        ...(config.app.env === 'development' && { token: resetToken })
      });

    } catch (error) {
      console.error('Request password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset request failed'
      });
    }
  }

  // Reset password with token
  async reset(req, res) {
    try {
      const { token, password } = req.body;

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      user.passwordHash = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.tokenVersion += 1; // Invalidate existing tokens
      await user.save();

      res.json({
        success: true,
        message: 'Password reset successful'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed'
      });
    }
  }

  // Change password (authenticated users)
  async change(req, res) {
    try {
      const { currentPassword, password } = req.body;
      
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      user.passwordHash = password;
      user.tokenVersion += 1; // Invalidate existing tokens
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password change failed'
      });
    }
  }
}

module.exports = new PasswordController();
