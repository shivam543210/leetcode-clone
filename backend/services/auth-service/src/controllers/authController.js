const User = require('../models/User');
const tokenService = require('../services/tokenService');
const config = require('../../../../../config/index');
const { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  ConflictError,
  NotFoundError,
  asyncHandler 
} = require('../../../../shared/middleware/errorHandler');



class AuthController {
  // User Registration
  register = asyncHandler(async (req, res, next) => {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const message = existingUser.email === email 
        ? 'Email already registered' 
        : 'Username already taken';
      throw new ConflictError(message);
    }

    // Create new user
    const user = new User({
      username,
      email,
      passwordHash: password // Will be hashed by pre-save middleware
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    
    await user.save();

    // Generate JWT tokens
    const tokens = tokenService.generateTokens(user);

    // TODO: Send verification email (will implement in email service)
    console.log(`Email verification token for ${email}: ${verificationToken}`);

    res.created({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        subscription: user.subscription.plan
      },
      ...tokens
    }, 'Registration successful. Please check your email for verification.');
  });

  // User Login
  login = asyncHandler(async (req, res, next) => {
    const { email, username, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: email || '' },
        { username: username || '' }
      ],
      isActive: true
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new AuthenticationError('Account is temporarily locked due to multiple failed login attempts');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      throw new AuthenticationError('Invalid credentials');
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const tokens = tokenService.generateTokens(user);

    res.success({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        subscription: user.subscription.plan,
        profile: user.profile,
        preferences: user.preferences
      },
      ...tokens
    }, 'Login successful');
  });

  // Refresh Token
  refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Verify refresh token
    const decoded = tokenService.verifyRefreshToken(refreshToken);
    
    // Find user and verify token version
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive || user.tokenVersion !== decoded.tokenVersion) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = tokenService.generateTokens(user);

    res.success(tokens, 'Token refreshed successfully');
  });

  // Logout
  logout = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.userId);
    
    if (user) {
      // Increment token version to invalidate all existing tokens
      user.tokenVersion += 1;
      await user.save();
    }

    res.success(null, 'Logout successful');
  });

  // Verify Email
  verifyEmail = asyncHandler(async (req, res, next) => {
    const { token } = req.body;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.success(null, 'Email verified successfully');
  });

  // Get Current User
  getCurrentUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.success({ user }, 'User information retrieved successfully');
  });
}

module.exports = new AuthController();

