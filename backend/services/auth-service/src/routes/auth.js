const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passwordController = require('../controllers/passwordController');
const authenticateToken = require('../middleware/authenticateToken');
const oauthController = require('../controllers/oauthController');
const userController = require('../controllers/userController');
const { authorizeRole, requireSubscription, verifyOwnership } = require('../middleware/authorizeRole');

// Import new validation middleware
const { 
  handleValidationErrors, 
  authValidators, 
  profileValidators 
} = require('../../../../shared/middleware/validation');

// Registration
router.post(
  '/register', 
  authValidators.register, 
  handleValidationErrors, 
  authController.register
);

// Login
router.post(
  '/login',
  authValidators.login,
  handleValidationErrors,
  authController.login
);

// Refresh token
router.post(
  '/refresh',
  authValidators.refreshToken,
  handleValidationErrors,
  authController.refreshToken
);

// Logout (must be authenticated)
router.post(
  '/logout',
  authenticateToken,
  authController.logout
);

// Email Verification
router.post(
  '/verify-email',
  authValidators.verifyEmail,
  handleValidationErrors,
  authController.verifyEmail
);

// Get current user
router.get(
  '/me',
  authenticateToken,
  authController.getCurrentUser
);

// Password management routes
router.post(
  '/forgot-password',
  authValidators.forgotPassword,
  handleValidationErrors,
  passwordController.requestReset
);

router.post(
  '/reset-password',
  authValidators.resetPassword,
  handleValidationErrors,
  passwordController.reset
);

router.post(
  '/change-password',
  authenticateToken,
  authValidators.changePassword,
  handleValidationErrors,
  passwordController.change
);

router.get('/oauth/google', oauthController.googleAuth);
router.get('/oauth/google/callback', oauthController.googleCallback);
router.get('/oauth/github', oauthController.githubAuth);
router.get('/oauth/github/callback', oauthController.githubCallback);
router.get('/oauth/linkedin', oauthController.linkedinAuth);
router.get('/oauth/linkedin/callback', oauthController.linkedinCallback);

// User profile routes
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, profileValidators.updateProfile, handleValidationErrors, userController.updateProfile);
router.put('/preferences', authenticateToken, profileValidators.updatePreferences, handleValidationErrors, userController.updatePreferences);
router.get('/statistics', authenticateToken, userController.getStatistics);
router.delete('/account', authenticateToken, userController.deleteAccount);

router.get('/users', authenticateToken, authorizeRole('admin'), userController.getAllUsers);
router.put('/users/:userId/role', authenticateToken, authorizeRole('admin'), userController.updateUserRole);

// Premium features
router.get('/premium/stats', authenticateToken, requireSubscription('premium', 'enterprise'), userController.getPremiumStats);
module.exports = router;
