const {body , validationResult} = require('express-validator');


// password 

const passwordValidator = () => {
    return body('password')
    .isLength({min:8})
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .withMessage('Password must contain at least one number, one uppercase and one lowercase letter')

};


// email

const emailValidator = () => {
    return body('email')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .trim()
    .toLowerCase()   
}

// UserValidatiion 

const userValidation = () => {
    return body('username')
    .isLength({min:3 , max:20})
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9]+$/)
    
    
}

//registration validation rules

// Registration validation rules
const registerValidation = [
  userValidation(),
  emailValidator(),
  passwordValidator(),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
];

//login validation rules

const loginValidation = [
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.username) {
      throw new Error('Either email or username is required');
    }
    return true;
  })
];

// Password reset validation
const passwordResetValidation = [
  emailValidator()
];

//change password validation 

// Change password validation
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  passwordValidator(),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
];

// Profile update validation
const profileUpdateValidation = [
  body('firstName').optional().isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName').optional().isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('location').optional().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('website').optional().isURL().withMessage('Please provide a valid website URL')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  passwordResetValidation,
  changePasswordValidation,
  profileUpdateValidation,
  handleValidationErrors
};