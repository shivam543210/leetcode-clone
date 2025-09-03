const User = require('../models/User');
const tokenService = require('../services/tokenService')
const config = require('../../../../../config/index');



class AuthController {
  // User Registration
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.email === email 
            ? 'Email already registered' 
            : 'Username already taken'
        });
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

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for verification.',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role,
            subscription: user.subscription.plan
          },
          ...tokens
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: config.app.env === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // User Login
  async login(req, res) {
    try {
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
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incrementLoginAttempts();
        
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
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

      res.json({
        success: true,
        message: 'Login successful',
        data: {
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
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: config.app.env === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Refresh Token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      
      // Find user and verify token version
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive || user.tokenVersion !== decoded.tokenVersion) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const tokens = tokenService.generateTokens(user);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (user) {
        // Increment token version to invalidate all existing tokens
        user.tokenVersion += 1;
        await user.save();
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  // Verify Email
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed'
      });
    }
  }

  // Get Current User
  async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId).select('-passwordHash');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user information'
      });
    }
  }
}

module.exports = new AuthController();

