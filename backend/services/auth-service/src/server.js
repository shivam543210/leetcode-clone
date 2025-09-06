require('dotenv').config({ path: '../../../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const config = require('../../../shared/config');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 5100; // Different port for auth service

// Middleware
app.use(helmet());
app.use(cors(config.security.cors));
app.use(express.json());

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
      message: 'Authentication service unavailable'
    });
  },
  onProxyReq: (proxyReq, req) => {
    // Forward original headers
    proxyReq.setHeader('X-Forwarded-For', req.ip);
    proxyReq.setHeader('X-Original-Host', req.get('host'));
  }
}));

// Health check for API Gateway
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: config.app.version,
    environment: config.app.env
  });
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

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: healthChecks.map(check => check.value)
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 All services health: http://localhost:${PORT}/health/all`);
  console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
});

module.exports = app;