const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const config = require('../../../shared/config');
const { connectMongoDB } = require('../../../shared/config/database');

const app = express();
const PORT =  config.app.port || 5000;

// Middleware
app.use(helmet());
app.use(cors(config.security.cors));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
//config rout
app.get('/api/config', (req, res) => {
  // Return safe config (no secrets)
  res.json({
    app: {
      name: config.app.name,
      version: config.app.version,
      environment: config.app.env
    },
    features: config.features,
    cors: {
      origins: config.security.cors.origins
    }
  });
});
// Basic route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'LeetCode Clone API is running!',
    timestamp: new Date().toISOString()
  });
});

// Start server
// Start server
app.listen(PORT, () => {
  console.log(`🚀 ${config.app.name} API Gateway`);
  console.log(`📡 Running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.app.env}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`⚙️  Config: http://localhost:${PORT}/api/config`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
});

