const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  // App Configuration
  app: {
    name: process.env.APP_NAME || 'LeetCode Clone',
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Database Configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/leetcode_dev?authSource=admin',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 50,
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 5
      }
    },
    postgresql: {
      uri: process.env.POSTGRESQL_URI || 'postgresql://postgres:password123@localhost:5432/leetcode_analytics',
      options: {
        max: parseInt(process.env.POSTGRESQL_MAX_CONNECTIONS) || 50,
        idleTimeoutMillis: parseInt(process.env.POSTGRESQL_IDLE_TIMEOUT) || 30000
      }
    },
    redis: {
      uri: process.env.REDIS_URI || 'redis://localhost:6379',
      options: {
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST) || 3
      }
    }
  },

  // Authentication Configuration
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-development',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: process.env.TOKEN_ISSUER || 'leetcode-clone',
      audience: process.env.TOKEN_AUDIENCE || 'leetcode-clone-users'
    },
    refreshToken: {
      secret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET
      }
    }
  },

  // Security Configuration
  security: {
    cors: {
      origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000
    },
    bcrypt: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
    }
  },

  // External Services
  services: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      orgId: process.env.OPENAI_ORG_ID,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    email: {
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com'
      }
    }
  },

  // Feature Flags
  features: {
    aiAssistance: process.env.FEATURE_AI_ASSISTANCE === 'true',
    contests: process.env.FEATURE_CONTESTS === 'true',
    premiumFeatures: process.env.FEATURE_PREMIUM === 'true'
  }
};

// Validation function
const validateConfig = () => {
  const required = [
    'JWT_SECRET',
    'MONGODB_URI',
    'POSTGRESQL_URI',
    'REDIS_URI'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('📝 Please check your .env file');
    process.exit(1);
  }
};

// Validate in non-test environments
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

module.exports = config;
