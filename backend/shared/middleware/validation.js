const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

/**
 * Enhanced Validation Error Handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    const validationError = new ValidationError('Validation failed', formattedErrors);
    return next(validationError);
  }
  
  next();
};

/**
 * Common Validation Rules
 */
const commonValidators = {
  // Email validation
  email: () => 
    body('email')
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail()
      .trim()
      .toLowerCase(),

  // Password validation
  password: () => 
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/)
      .withMessage('Password must contain at least one number, one uppercase letter, one lowercase letter, and one special character'),

  // Username validation
  username: () => 
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
      .trim(),

  // ObjectId validation
  objectId: (field = 'id') => 
    param(field)
      .isMongoId()
      .withMessage(`Invalid ${field} format`),

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('sort')
      .optional()
      .isIn(['asc', 'desc', '1', '-1'])
      .withMessage('Sort must be asc, desc, 1, or -1')
  ],

  // Search validation
  search: () => 
    query('q')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters')
      .trim()
      .escape(),

  // File validation
  file: (fieldName, options = {}) => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [] } = options;
    
    return (req, res, next) => {
      const file = req.file || req.files?.[fieldName];
      
      if (!file && options.required) {
        return next(new ValidationError(`${fieldName} is required`));
      }
      
      if (file) {
        // Check file size
        if (file.size > maxSize) {
          return next(new ValidationError(`${fieldName} size must be less than ${maxSize / (1024 * 1024)}MB`));
        }
        
        // Check file type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
          return next(new ValidationError(`${fieldName} must be one of: ${allowedTypes.join(', ')}`));
        }
      }
      
      next();
    };
  }
};

/**
 * Auth-specific Validation Rules
 */
const authValidators = {
  register: [
    commonValidators.username(),
    commonValidators.email(),
    commonValidators.password(),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
    body('firstName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters')
      .trim(),
    body('lastName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters')
      .trim(),
    body('acceptTerms')
      .isBoolean()
      .withMessage('Must accept terms and conditions')
      .custom((value) => {
        if (!value) {
          throw new Error('Must accept terms and conditions');
        }
        return true;
      })
  ],

  login: [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('username')
      .optional()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body()
      .custom((value, { req }) => {
        if (!req.body.email && !req.body.username) {
          throw new Error('Either email or username is required');
        }
        return true;
      }),
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be a boolean')
  ],

  forgotPassword: [
    commonValidators.email()
  ],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required')
      .isLength({ min: 32, max: 256 })
      .withMessage('Invalid token format'),
    commonValidators.password(),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      })
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidators.password(),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      })
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
      .isJWT()
      .withMessage('Invalid refresh token format')
  ],

  verifyEmail: [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required')
      .isLength({ min: 32, max: 256 })
      .withMessage('Invalid token format')
  ]
};

/**
 * User Profile Validation Rules
 */
const profileValidators = {
  updateProfile: [
    body('firstName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters')
      .trim(),
    body('lastName')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters')
      .trim(),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters')
      .trim(),
    body('location')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters')
      .trim(),
    body('website')
      .optional()
      .isURL()
      .withMessage('Please provide a valid website URL'),
    body('githubUsername')
      .optional()
      .matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/)
      .withMessage('Invalid GitHub username format'),
    body('linkedinProfile')
      .optional()
      .isURL()
      .withMessage('Please provide a valid LinkedIn URL')
  ],

  updatePreferences: [
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'auto'])
      .withMessage('Theme must be light, dark, or auto'),
    body('language')
      .optional()
      .isIn(['en', 'es', 'fr', 'de', 'zh', 'ja'])
      .withMessage('Invalid language selection'),
    body('emailNotifications')
      .optional()
      .isBoolean()
      .withMessage('Email notifications must be a boolean'),
    body('pushNotifications')
      .optional()
      .isBoolean()
      .withMessage('Push notifications must be a boolean'),
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard')
  ]
};

/**
 * Sanitization Middleware
 */
const sanitizeInput = (req, res, next) => {
  // Remove null bytes and control characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

/**
 * Rate Limiting Validation
 */
const rateLimitValidation = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }

    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= max) {
      const error = new ValidationError('Too many requests, please try again later');
      error.statusCode = 429;
      return next(error);
    }

    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
};

module.exports = {
  handleValidationErrors,
  commonValidators,
  authValidators,
  profileValidators,
  sanitizeInput,
  rateLimitValidation
};