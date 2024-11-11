/**
 * Environment Configuration Module
 * Centralizes all environment variable access and provides defaults
 */

require('dotenv').config();

const environment = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || './.data/database.db',
  
  // Authentication Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: '24h',
  
  // Email Configuration
  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE || 'smtp.gmail.com',
    USER: process.env.EMAIL_USER,
    PASSWORD: process.env.EMAIL_PASSWORD,
    FROM: process.env.EMAIL_USER || 'noreply@propertymanagement.com'
  },
  
  // Twilio Configuration
  TWILIO: {
    ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    FROM_NUMBER: process.env.TWILIO_FROM_NUMBER
  },
  
  // Security Configuration
  BCRYPT_ROUNDS: 12,
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  
  // Cors Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Required environment variable ${envVar} is missing`);
    process.exit(1);
  }
}

module.exports = environment;
