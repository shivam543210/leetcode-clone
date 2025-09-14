/**
 * Standardized API Response Formatter
 */

/**
 * Success Response Format
 */
const successResponse = (data = null, message = 'Success', meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

/**
 * Error Response Format
 */
const errorResponse = (message, code = 'ERROR', details = null, statusCode = 500) => {
  const response = {
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString()
    }
  };

  if (details !== null) {
    response.error.details = details;
  }

  return response;
};

/**
 * Paginated Response Format
 */
const paginatedResponse = (data, pagination, message = 'Success') => {
  return successResponse(data, message, {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    }
  });
};

/**
 * List Response Format
 */
const listResponse = (items, total, message = 'Success') => {
  return successResponse(items, message, {
    count: items.length,
    total
  });
};

/**
 * Created Response Format
 */
const createdResponse = (data, message = 'Resource created successfully') => {
  return successResponse(data, message);
};

/**
 * Updated Response Format
 */
const updatedResponse = (data, message = 'Resource updated successfully') => {
  return successResponse(data, message);
};

/**
 * Deleted Response Format
 */
const deletedResponse = (message = 'Resource deleted successfully') => {
  return successResponse(null, message);
};

/**
 * No Content Response Format
 */
const noContentResponse = () => {
  return successResponse(null, 'No content');
};

/**
 * Validation Error Response Format
 */
const validationErrorResponse = (errors) => {
  return errorResponse(
    'Validation failed',
    'VALIDATION_ERROR',
    errors,
    400
  );
};

/**
 * Authentication Error Response Format
 */
const authErrorResponse = (message = 'Authentication failed') => {
  return errorResponse(message, 'AUTHENTICATION_ERROR', null, 401);
};

/**
 * Authorization Error Response Format
 */
const authorizationErrorResponse = (message = 'Access denied') => {
  return errorResponse(message, 'AUTHORIZATION_ERROR', null, 403);
};

/**
 * Not Found Error Response Format
 */
const notFoundErrorResponse = (resource = 'Resource') => {
  return errorResponse(`${resource} not found`, 'NOT_FOUND_ERROR', null, 404);
};

/**
 * Conflict Error Response Format
 */
const conflictErrorResponse = (message = 'Resource conflict') => {
  return errorResponse(message, 'CONFLICT_ERROR', null, 409);
};

/**
 * Rate Limit Error Response Format
 */
const rateLimitErrorResponse = (message = 'Too many requests') => {
  return errorResponse(message, 'RATE_LIMIT_ERROR', null, 429);
};

/**
 * Server Error Response Format
 */
const serverErrorResponse = (message = 'Internal server error') => {
  return errorResponse(message, 'INTERNAL_ERROR', null, 500);
};

/**
 * Service Unavailable Error Response Format
 */
const serviceUnavailableErrorResponse = (message = 'Service temporarily unavailable') => {
  return errorResponse(message, 'SERVICE_UNAVAILABLE_ERROR', null, 503);
};

/**
 * Response Middleware
 * Adds response formatter methods to res object
 */
const responseMiddleware = (req, res, next) => {
  // Success responses
  res.success = (data, message, meta) => {
    return res.json(successResponse(data, message, meta));
  };

  res.created = (data, message) => {
    return res.status(201).json(createdResponse(data, message));
  };

  res.updated = (data, message) => {
    return res.json(updatedResponse(data, message));
  };

  res.deleted = (message) => {
    return res.json(deletedResponse(message));
  };

  res.noContent = () => {
    return res.status(204).json(noContentResponse());
  };

  res.paginated = (data, pagination, message) => {
    return res.json(paginatedResponse(data, pagination, message));
  };

  res.list = (items, total, message) => {
    return res.json(listResponse(items, total, message));
  };

  // Error responses
  res.error = (message, code, details, statusCode) => {
    return res.status(statusCode || 500).json(errorResponse(message, code, details, statusCode));
  };

  res.validationError = (errors) => {
    return res.status(400).json(validationErrorResponse(errors));
  };

  res.authError = (message) => {
    return res.status(401).json(authErrorResponse(message));
  };

  res.authorizationError = (message) => {
    return res.status(403).json(authorizationErrorResponse(message));
  };

  res.notFound = (resource) => {
    return res.status(404).json(notFoundErrorResponse(resource));
  };

  res.conflict = (message) => {
    return res.status(409).json(conflictErrorResponse(message));
  };

  res.rateLimitError = (message) => {
    return res.status(429).json(rateLimitErrorResponse(message));
  };

  res.serverError = (message) => {
    return res.status(500).json(serverErrorResponse(message));
  };

  res.serviceUnavailable = (message) => {
    return res.status(503).json(serviceUnavailableErrorResponse(message));
  };

  next();
};

module.exports = {
  // Response formatters
  successResponse,
  errorResponse,
  paginatedResponse,
  listResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  noContentResponse,
  
  // Error response formatters
  validationErrorResponse,
  authErrorResponse,
  authorizationErrorResponse,
  notFoundErrorResponse,
  conflictErrorResponse,
  rateLimitErrorResponse,
  serverErrorResponse,
  serviceUnavailableErrorResponse,
  
  // Middleware
  responseMiddleware
};