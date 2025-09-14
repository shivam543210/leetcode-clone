# Centralized Error Handling & Logging System

## Overview

This document describes the comprehensive error handling, logging, and validation system implemented for the LeetCode Clone project. The system provides:

- **Centralized error handling** with typed error responses
- **Comprehensive input validation** with detailed error messages
- **Request/response logging** with execution time tracking
- **Structured JSON responses** for all API endpoints
- **Security monitoring** and suspicious activity detection

## Architecture

### Core Components

1. **Error Handler Middleware** (`/shared/middleware/errorHandler.js`)
2. **Logger Middleware** (`/shared/middleware/logger.js`)
3. **Validation Middleware** (`/shared/middleware/validation.js`)
4. **Response Formatter** (`/shared/utils/responseFormatter.js`)

## Error Handling

### Custom Error Classes

```javascript
// Available error types
AppError              // Base error class
ValidationError       // Input validation errors (400)
AuthenticationError   // Authentication failures (401)
AuthorizationError    // Access denied (403)
NotFoundError        // Resource not found (404)
ConflictError        // Resource conflicts (409)
RateLimitError       // Too many requests (429)
ServiceUnavailableError // Service down (503)
```

### Usage in Controllers

```javascript
const { asyncHandler, ValidationError, NotFoundError } = require('../../shared/middleware/errorHandler');

class UserController {
  // Wrap async functions with asyncHandler
  getUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    res.success({ user }, 'User retrieved successfully');
  });
}
```

### Error Response Format

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "NOT_FOUND_ERROR",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/auth/users/123",
    "method": "GET",
    "requestId": "req_1705312200000_abc123def"
  }
}
```

For validation errors, additional details are included:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/auth/register",
    "method": "POST",
    "requestId": "req_1705312200000_abc123def",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "value": "invalid-email",
        "location": "body"
      }
    ]
  }
}
```

## Logging System

### Features

- **Request/Response logging** with execution time
- **Performance monitoring** (slow request detection)
- **Security monitoring** (suspicious activity detection)
- **Structured JSON logs** for production
- **Colored console logs** for development
- **Automatic log rotation** in production

### Log Levels

- `error`: Application errors and exceptions
- `warn`: Warnings, slow requests, security alerts
- `info`: Request/response logs, general information
- `debug`: Detailed debugging information

### Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Request completed",
  "service": "auth-service",
  "requestId": "req_1705312200000_abc123def",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "duration": "245ms",
  "userId": "user_123",
  "ip": "192.168.1.100"
}
```

### Usage

The logging middleware is automatically applied to all routes. No manual logging is required for basic request/response tracking.

## Validation System

### Built-in Validators

```javascript
// Common validators
commonValidators.email()        // Email validation
commonValidators.password()     // Strong password validation
commonValidators.username()     // Username format validation
commonValidators.objectId()     // MongoDB ObjectId validation
commonValidators.pagination()   // Page/limit validation
commonValidators.search()       // Search query validation

// Auth-specific validators
authValidators.register         // Registration validation
authValidators.login           // Login validation
authValidators.forgotPassword  // Password reset validation
authValidators.resetPassword   // Password reset confirmation
authValidators.changePassword  // Password change validation
authValidators.refreshToken    // Token refresh validation
authValidators.verifyEmail     // Email verification validation

// Profile validators
profileValidators.updateProfile     // Profile update validation
profileValidators.updatePreferences // User preferences validation
```

### Usage in Routes

```javascript
const { authValidators, handleValidationErrors } = require('../../shared/middleware/validation');

router.post(
  '/register',
  authValidators.register,      // Apply validation rules
  handleValidationErrors,       // Handle validation errors
  authController.register       // Controller method
);
```

### Custom Validation

```javascript
const { body } = require('express-validator');

const customValidation = [
  body('customField')
    .isLength({ min: 5, max: 50 })
    .withMessage('Custom field must be between 5 and 50 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Custom field can only contain alphanumeric characters')
];
```

## Response Formatting

### Success Responses

```javascript
// Standard success response
res.success(data, message, meta);

// Created resource
res.created(data, message);

// Updated resource
res.updated(data, message);

// Deleted resource
res.deleted(message);

// Paginated response
res.paginated(data, pagination, message);

// List response
res.list(items, total, message);
```

### Success Response Format

```json
{
  "success": true,
  "message": "Login successful",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Paginated Response Format

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Security Features

### Input Sanitization

- Automatic removal of null bytes and control characters
- XSS prevention through input escaping
- SQL injection pattern detection

### Suspicious Activity Detection

The system automatically detects and logs:

- Path traversal attempts (`../`)
- XSS injection attempts (`<script>`)
- SQL injection attempts (`union select`)
- Code injection attempts (`eval(`, `javascript:`)
- Multiple failed authentication attempts

### Rate Limiting

```javascript
const { rateLimitValidation } = require('../../shared/middleware/validation');

// Apply rate limiting (100 requests per 15 minutes)
router.use('/api/auth/login', rateLimitValidation(15 * 60 * 1000, 100));
```

## Implementation Guide

### 1. Service Setup

```javascript
// In your service's server.js
const { globalErrorHandler, notFoundHandler } = require('../../shared/middleware/errorHandler');
const { requestLogger, performanceLogger, securityLogger } = require('../../shared/middleware/logger');
const { responseMiddleware } = require('../../shared/utils/responseFormatter');
const { sanitizeInput } = require('../../shared/middleware/validation');

const app = express();

// Apply middleware in order
app.use(sanitizeInput);
app.use(responseMiddleware);
app.use(requestLogger('service-name'));
app.use(performanceLogger('service-name'));
app.use(securityLogger('service-name'));

// Your routes here
app.use('/api/endpoint', routes);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);
```

### 2. Controller Implementation

```javascript
const { asyncHandler, NotFoundError } = require('../../shared/middleware/errorHandler');

class MyController {
  getResource = asyncHandler(async (req, res, next) => {
    const resource = await MyModel.findById(req.params.id);
    
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }
    
    res.success({ resource }, 'Resource retrieved successfully');
  });
}
```

### 3. Route Validation

```javascript
const { authValidators, handleValidationErrors } = require('../../shared/middleware/validation');

router.post(
  '/endpoint',
  authValidators.login,
  handleValidationErrors,
  controller.method
);
```

## Monitoring & Debugging

### Request Tracking

Every request gets a unique `requestId` that appears in:
- Response headers (`X-Request-ID`)
- All log entries
- Error responses

Use this ID to trace a request through the entire system.

### Performance Monitoring

- Requests taking longer than 1000ms are automatically flagged as slow
- Memory and CPU usage is logged for debugging
- Response times are tracked for all endpoints

### Log Analysis

In production, logs are written to files:
- `logs/service-error.log` - Error logs only
- `logs/service-combined.log` - All logs

Use log aggregation tools like ELK stack or Splunk for analysis.

## Best Practices

1. **Always use `asyncHandler`** for async route handlers
2. **Throw specific error types** instead of generic errors
3. **Use validation middleware** for all input validation
4. **Include meaningful error messages** for better debugging
5. **Don't expose sensitive information** in error messages
6. **Monitor logs regularly** for security threats
7. **Use structured logging** for better searchability

## Testing Error Handling

```javascript
// Test error responses
describe('Error Handling', () => {
  it('should return 404 for non-existent resource', async () => {
    const response = await request(app)
      .get('/api/users/nonexistent')
      .expect(404);
    
    expect(response.body).toMatchObject({
      success: false,
      error: {
        message: 'User not found',
        code: 'NOT_FOUND_ERROR'
      }
    });
  });
});
```

This comprehensive system ensures that all API responses are consistent, all errors are properly handled, and all requests are logged for monitoring and debugging purposes.