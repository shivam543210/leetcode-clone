const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passwordController = require('../controllers/passwordController');
const authenticateToken = require('../middleware/authenticateToken');
const validators = require('../utils/validators');

// Registration
router.post(
  '/register', 
  validators.registerValidation, 
  validators.handleValidationErrors, 
  authController.register
);

// Login
router.post(
  '/login',
  validators.loginValidation,
  validators.handleValidationErrors,
  authController.login
);

// Refresh token
router.post(
  '/refresh',
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
  validators.passwordResetValidation,
  validators.handleValidationErrors,
  passwordController.requestReset
);

router.post(
  '/reset-password',
  passwordController.reset
);

router.post(
  '/change-password',
  authenticateToken,
  validators.changePasswordValidation,
  validators.handleValidationErrors,
  passwordController.change
);

module.exports = router;
