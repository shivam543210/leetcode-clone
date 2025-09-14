const winston = require('winston');
const config = require('../config');

/**
 * Winston Logger Configuration
 */
const createLogger = (serviceName) => {
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, service, requestId, userId, method, url, ip, userAgent, duration, statusCode, ...meta }) => {
      const logEntry = {
        timestamp,
        level,
        message,
        service: service || serviceName,
        ...(requestId && { requestId }),
        ...(userId && { userId }),
        ...(method && { method }),
        ...(url && { url }),
        ...(ip && { ip }),
        ...(userAgent && { userAgent }),
        ...(duration !== undefined && { duration: `${duration}ms` }),
        ...(statusCode && { statusCode }),
        ...meta
      };
      return JSON.stringify(logEntry);
    })
  );

  const transports = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, service, requestId, method, url, duration, statusCode }) => {
          let logMessage = `${timestamp} [${level}] ${service || serviceName}: ${message}`;
          if (method && url) {
            logMessage += ` | ${method} ${url}`;
          }
          if (duration !== undefined) {
            logMessage += ` | ${duration}ms`;
          }
          if (statusCode) {
            logMessage += ` | ${statusCode}`;
          }
          if (requestId) {
            logMessage += ` | ${requestId}`;
          }
          return logMessage;
        })
      )
    })
  ];

  // Add file transports in production
  if (config.app.env === 'production') {
    transports.push(
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        format: logFormat
      }),
      new winston.transports.File({
        filename: `logs/${serviceName}-combined.log`,
        format: logFormat
      })
    );
  }

  return winston.createLogger({
    level: config.app.env === 'development' ? 'debug' : 'info',
    format: logFormat,
    transports,
    exitOnError: false
  });
};

/**
 * Request ID Generator
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Request Logger Middleware
 */
const requestLogger = (serviceName) => {
  const logger = createLogger(serviceName);

  return (req, res, next) => {
    // Generate unique request ID
    req.requestId = generateRequestId();
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.requestId);

    // Start timer
    const startTime = Date.now();

    // Log request start
    logger.info('Request started', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
      body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
      query: Object.keys(req.query).length > 0 ? req.query : undefined
    });

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      // Log response
      logger.info('Request completed', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.userId,
        responseSize: JSON.stringify(data).length
      });

      return originalJson.call(this, data);
    };

    // Handle response finish for non-JSON responses
    res.on('finish', () => {
      if (!res.headersSent || res.getHeader('content-type')?.includes('json')) {
        return; // Already logged by json override
      }

      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.userId
      });
    });

    next();
  };
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'confirmPassword', 'token', 'refreshToken', 'secret', 'key'];
  const sanitized = { ...body };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Performance Logger Middleware
 */
const performanceLogger = (serviceName) => {
  const logger = createLogger(serviceName);

  return (req, res, next) => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      // Log slow requests (> 1000ms)
      if (duration > 1000) {
        logger.warn('Slow request detected', {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          duration: Math.round(duration),
          statusCode: res.statusCode,
          userId: req.user?.userId
        });
      }

      // Log performance metrics
      logger.debug('Request performance', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        duration: Math.round(duration),
        statusCode: res.statusCode,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      });
    });

    next();
  };
};

/**
 * Security Logger Middleware
 */
const securityLogger = (serviceName) => {
  const logger = createLogger(serviceName);

  return (req, res, next) => {
    // Log suspicious activities
    const suspiciousPatterns = [
      /\.\./,  // Path traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /javascript:/i,  // JavaScript injection
      /eval\(/i,  // Code injection
    ];

    const checkSuspicious = (value) => {
      if (typeof value === 'string') {
        return suspiciousPatterns.some(pattern => pattern.test(value));
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkSuspicious);
      }
      return false;
    };

    // Check URL, query params, and body for suspicious content
    const suspicious = checkSuspicious(req.originalUrl) || 
                     checkSuspicious(req.query) || 
                     checkSuspicious(req.body);

    if (suspicious) {
      logger.warn('Suspicious request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
        body: sanitizeBody(req.body),
        query: req.query
      });
    }

    // Log failed authentication attempts
    res.on('finish', () => {
      if (res.statusCode === 401 && req.originalUrl.includes('/auth/')) {
        logger.warn('Authentication failure', {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          body: sanitizeBody(req.body)
        });
      }
    });

    next();
  };
};

module.exports = {
  createLogger,
  requestLogger,
  performanceLogger,
  securityLogger,
  generateRequestId,
  sanitizeBody
};