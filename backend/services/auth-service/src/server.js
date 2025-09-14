require('dotenv').config({ path: '../../../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const config = require('../../../shared/config');
const authRoutes = require('./routes/auth');

// Import shared middleware
const { globalErrorHandler, notFoundHandler, asyncHandler } = require('../../../shared/middleware/errorHandler');
const { requestLogger, performanceLogger, securityLogger } = require('../../../shared/middleware/logger');
const { responseMiddleware } = require('../../../shared/utils/responseFormatter');
const { sanitizeInput } = require('../../../shared/middleware/validation');

const app = express();
const PORT = 5100; // Different port for auth service

// Security middleware
app.use(helmet());
app.use(cors(config.security.cors));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(sanitizeInput);
app.use(responseMiddleware);
app.use(requestLogger('auth-service'));
app.use(performanceLogger('auth-service'));
app.use(securityLogger('auth-service'));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.database.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.success({
    status: 'healthy',
    service: 'auth-service',
    version: config.app.version,
    environment: config.app.env,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  }, 'Auth service is healthy');
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Auth Service running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
      console.log(`🌍 Environment: ${config.app.env}`);
    });
  } catch (error) {
    console.error('❌ Failed to start auth service:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;