/**
 * Rate Limiter Middleware
 * Provides flexible rate limiting with multiple strategies
 */

const Redis = require('ioredis');
const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const { 
  REDIS_URL, 
  REDIS_PASSWORD,
  NODE_ENV 
} = require('../../config/environment');
const logger = require('../../utils/logger');
const { AuthenticationError } = require('./errorHandler');

class RateLimiter {
  constructor() {
    this.limiters = new Map();
    this.redis = null;
    this.initialized = false;
  }

  /**
   * Initialize rate limiter
   */
  async init() {
    if (this.initialized) return;

    try {
      if (REDIS_URL) {
        this.redis = new Redis(REDIS_URL, {
          password: REDIS_PASSWORD,
          enableOfflineQueue: false
        });
        await this.redis.ping();
        logger.info('Rate limiter Redis connection established');
      }
    } catch (error) {
      logger.warn('Redis connection failed, using memory rate limiter:', error);
      this.redis = null;
    }

    this.initialized = true;
  }

  /**
   * Create rate limiter instance
   * @param {Object} options - Rate limiter options
   * @returns {RateLimiterRedis|RateLimiterMemory} Rate limiter instance
   */
  createLimiter(options) {
    const key = JSON.stringify(options);
    
    if (this.limiters.has(key)) {
      return this.limiters.get(key);
    }

    const limiterOptions = {
      ...options,
      storeClient: this.redis
    };

    const limiter = this.redis
      ? new RateLimiterRedis(limiterOptions)
      : new RateLimiterMemory(limiterOptions);

    this.limiters.set(key, limiter);
    return limiter;
  }

  /**
   * Get client identifier
   * @param {Object} req - Express request object
   * @param {Object} options - Rate limiter options
   * @returns {string} Client identifier
   */
  getClientId(req, options) {
    if (options.identifyBy === 'user' && req.user) {
      return `user:${req.user.id}`;
    }
    
    if (options.identifyBy === 'session' && req.session) {
      return `session:${req.session.id}`;
    }

    // Get IP address considering proxy headers
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.connection.remoteAddress;
    
    return `ip:${ip}`;
  }

  /**
   * Create middleware with specific options
   * @param {Object} options - Rate limiter options
   * @returns {Function} Express middleware
   */
  middleware(options = {}) {
    const defaultOptions = {
      points: 60, // Number of points
      duration: 60, // Per duration in seconds
      blockDuration: 0, // Block duration in seconds
      identifyBy: 'ip', // ip, user, or session
      errorMessage: 'Too many requests, please try again later.',
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
      keyPrefix: 'rl',
      whiteList: [], // Array of IPs or user IDs to whitelist
      blackList: [], // Array of IPs or user IDs to blacklist
    };

    const config = { ...defaultOptions, ...options };

    return async (req, res, next) => {
      try {
        await this.init();

        const clientId = this.getClientId(req, config);

        // Check whitelist
        if (config.whiteList.includes(clientId.split(':')[1])) {
          return next();
        }

        // Check blacklist
        if (config.blackList.includes(clientId.split(':')[1])) {
          throw new AuthenticationError('Access denied');
        }

        const key = `${config.keyPrefix}:${clientId}`;
        const limiter = this.createLimiter(config);

        try {
          const rateLimiterRes = await limiter.consume(key);
          
          // Set rate limit headers
          res.set({
            'X-RateLimit-Limit': config.points,
            'X-RateLimit-Remaining': rateLimiterRes.remainingPoints,
            'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext)
          });

          // Store rate limiter result for logging
          req.rateLimit = rateLimiterRes;
          
          next();
        } catch (rateLimiterRes) {
          const timeLeft = Math.ceil(rateLimiterRes.msBeforeNext / 1000);

          // Set rate limit headers
          res.set({
            'X-RateLimit-Limit': config.points,
            'X-RateLimit-Remaining': 0,
            'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext),
            'Retry-After': timeLeft
          });

          logger.warn(`Rate limit exceeded for ${clientId}`);

          res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: config.errorMessage,
              retryAfter: timeLeft
            }
          });
        }
      } catch (error) {
        logger.error('Rate limiter error:', error);
        next(error);
      }
    };
  }

  /**
   * Predefined rate limiters
   */
  static presets = {
    /**
     * Strict rate limiter for authentication endpoints
     */
    auth: {
      points: 5,
      duration: 60 * 15, // 15 minutes
      blockDuration: 60 * 60, // 1 hour
      keyPrefix: 'rl:auth',
      errorMessage: 'Too many authentication attempts, please try again later.'
    },

    /**
     * Rate limiter for API endpoints
     */
    api: {
      points: 60,
      duration: 60,
      keyPrefix: 'rl:api',
      errorMessage: 'API rate limit exceeded.'
    },

    /**
     * Rate limiter for file uploads
     */
    upload: {
      points: 10,
      duration: 60 * 60, // 1 hour
      keyPrefix: 'rl:upload',
      errorMessage: 'Upload limit exceeded, please try again later.'
    },

    /**
     * Rate limiter for search endpoints
     */
    search: {
      points: 30,
      duration: 60,
      keyPrefix: 'rl:search',
      errorMessage: 'Search rate limit exceeded.'
    }
  };
}

// Export singleton instance
module.exports = new RateLimiter();
