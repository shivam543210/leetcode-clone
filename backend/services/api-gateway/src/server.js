const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../../../shared/config');
const { connectMongoDB } = require('../../../shared/config/database');

// Import shared middleware
const { globalErrorHandler, notFoundHandler } = require('../../../shared/middleware/errorHandler');
const { requestLogger, performanceLogger, securityLogger } = require('../../../shared/middleware/logger');
const { responseMiddleware } = require('../../../shared/utils/responseFormatter');
const { sanitizeInput } = require('../../../shared/middleware/validation');

const app = express();
const PORT = config.app.port || 5000;

// Security middleware
app.use(helmet());
app.use(cors(config.security.cors));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(sanitizeInput);
app.use(responseMiddleware);
app.use(requestLogger('api-gateway'));
app.use(performanceLogger('api-gateway'));
app.use(securityLogger('api-gateway'));

// Proxy authentication requests to auth service
app.use('/api/auth', createProxyMiddleware({
  target: 'http://localhost:5100',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    console.error('Auth service proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: {
        message: 'Authentication service unavailable',
        code: 'SERVICE_UNAVAILABLE_ERROR',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        requestId: req.requestId
      }
    });
  },
  onProxyReq: (proxyReq, req) => {
    // Forward original headers
    proxyReq.setHeader('X-Forwarded-For', req.ip);
    proxyReq.setHeader('X-Original-Host', req.get('host'));
    proxyReq.setHeader('X-Request-ID', req.requestId);
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.success({
    status: 'healthy',
    version: '1.0.0',
    service: 'api-gateway',
    environment: config.app.env
  }, 'API Gateway is healthy');
});

// Config route
app.get('/api/config', (req, res) => {
  res.success({
    app: {
      name: config.app.name,
      version: config.app.version,
      environment: config.app.env
    },
    features: config.features,
    cors: {
      origins: config.security.cors.origins
    }
  }, 'Configuration retrieved successfully');
});

// Test route
app.get('/api/test', (req, res) => {
  res.success({
    message: 'LeetCode Clone API is running!',
    service: 'api-gateway',
    environment: config.app.env
  }, 'API Gateway test successful');
});

// Global health check for all services
app.get('/health/all', async (req, res) => {
  const services = [
    { name: 'auth-service', url: 'http://localhost:5100/health' },
    // Add other services here
  ];

  const healthChecks = await Promise.allSettled(
    services.map(async (service) => {
      try {
        const response = await fetch(service.url);
        const data = await response.json();
        return { name: service.name, status: 'healthy', data };
      } catch (error) {
        return { name: service.name, status: 'unhealthy', error: error.message };
      }
    })
  );

  const allHealthy = healthChecks.every(check => 
    check.status === 'fulfilled' && check.value.status === 'healthy'
  );

  const statusCode = allHealthy ? 200 : 503;
  const message = allHealthy ? 'All services are healthy' : 'Some services are unhealthy';

  res.status(statusCode).json({
    success: allHealthy,
    message,
    data: {
      status: allHealthy ? 'healthy' : 'degraded',
      services: healthChecks.map(check => check.value)
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ${config.app.name} API Gateway`);
  console.log(`📡 Running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.app.env}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`⚙️  Config: http://localhost:${PORT}/api/config`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`🔄 All services health: http://localhost:${PORT}/health/all`);
  console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
});

module.exports = app;

