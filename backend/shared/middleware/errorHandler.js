const config = require('../config');

/**
 * Custom Error Classes
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR');
  }
}

/**
 * Error Response Formatter
 */
const formatErrorResponse = (error, req) => {
  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.errorCode || 'INTERNAL_ERROR',
      timestamp: error.timestamp || new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      requestId: req.requestId
    }
  };

  // Add details for validation errors
  if (error.details) {
    response.error.details = error.details;
  }

  // Add stack trace in development
  if (config.app.env === 'development' && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
};

/**
 * Global Error Handler Middleware
 */
const globalErrorHandler = (error, req, res, next) => {
  // Log the error
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.originalUrl}:`, {
    message: error.message,
    stack: error.stack,
    requestId: req.requestId,
    userId: req.user?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle different error types
  let appError = error;

  // Convert known errors to AppError instances
  if (error.name === 'ValidationError') {
    // Mongoose validation error
    const details = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    appError = new ValidationError('Validation failed', details);
  } else if (error.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId, etc.)
    appError = new ValidationError(`Invalid ${error.path}: ${error.value}`);
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    appError = new ConflictError(`${field} '${value}' already exists`);
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Token expired');
  } else if (error.name === 'MulterError') {
    // File upload errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      appError = new ValidationError('File too large');
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      appError = new ValidationError('Too many files');
    } else {
      appError = new ValidationError(`File upload error: ${error.message}`);
    }
  } else if (!error.isOperational) {
    // Unknown error - convert to generic AppError
    appError = new AppError(
      config.app.env === 'development' ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }

  // Send error response
  const statusCode = appError.statusCode || 500;
  const errorResponse = formatErrorResponse(appError, req);

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Handler Middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async Error Wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  // Error Classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  
  // Middleware
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  
  // Utilities
  formatErrorResponse
};