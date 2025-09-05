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

// Register auth routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: config.app.version,
    environment: config.app.env
  });
});

// Connect to database and start server
mongoose.connect(config.database.mongodb.uri, config.database.mongodb.options)
  .then(() => {
    console.log('✅ MongoDB connected (auth-service)');
    app.listen(PORT, () => {
      console.log(`🚀 Auth Service running on http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error (auth-service):', err.message);
    process.exit(1);
  });

module.exports = app;
