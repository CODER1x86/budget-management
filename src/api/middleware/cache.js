/**
 * Cache Middleware
 * Provides route-level caching functionality
 */

const cacheService = require('../services/cacheService');
const logger = require('../../utils/logger');

class CacheMiddleware {
  /**
   * Create cache middleware
   * @param {number} ttl - Cache TTL in seconds
   * @param {Function} keyGenerator - Custom key generator function
   */
  static cache(ttl, keyGenerator) {
    return async (req, res, next) => {
      const key = keyGenerator 
        ? keyGenerator(req)
        : `${req.method}:${req.originalUrl}`;

      try {
        const cachedResponse = await cacheService.get(key);

        if (cachedResponse) {
          logger.debug(`Cache hit for key: ${key}`);
          return res.json(cachedResponse);
        }

        // Store original res.json
        const originalJson = res.json;

        // Override res.json method
        res.json = function(body) {
          // Restore original res.json
          res.json = originalJson;

          // Cache the response
          cacheService.set(key, body, ttl);

          // Send the response
          return res.json(body);
        };

        next();
      } catch (error) {
        logger.error('Cache middleware error:', error);
        next();
      }
    };
  }

  /**
   * Clear cache middleware
   * @param {string|string[]} keys - Cache keys to clear
   */
  static clearCache(keys) {
    return async (req, res, next) => {
      try {
        if (Array.isArray(keys)) {
          await Promise.all(keys.map(key => cacheService.delete(key)));
        } else {
          await cacheService.delete(keys);
        }
      } catch (error) {
        logger.error('Clear cache middleware error:', error);
      }
      next();
    };
  }

  /**
   * Cache by user middleware
   * @param {number} ttl - Cache TTL in seconds
   */
  static cacheByUser(ttl) {
    return this.cache(ttl, (req) => {
      const userId = req.user ? req.user.id : 'anonymous';
      return `${userId}:${req.method}:${req.originalUrl}`;
    });
  }

  /**
   * Cache by role middleware
   * @param {number} ttl - Cache TTL in seconds
   */
  static cacheByRole(ttl) {
    return this.cache(ttl, (req) => {
      const role = req.user ? req.user.role : 'anonymous';
      return `${role}:${req.method}:${req.originalUrl}`;
    });
  }
}

module.exports = CacheMiddleware;
