/**
 * Cache Service
 * Provides caching functionality using Redis with fallback to in-memory cache
 */

const Redis = require('ioredis');
const NodeCache = require('node-cache');
const logger = require('../../utils/logger');
const {
  REDIS_URL,
  REDIS_PASSWORD,
  CACHE_TTL,
  CACHE_CHECK_PERIOD
} = require('../../config/environment');

class CacheService {
  constructor() {
    this.client = null;
    this.localCache = null;
    this.useRedis = false;
    this.initialized = false;
  }

  /**
   * Initialize cache service
   */
  async init() {
    if (this.initialized) return;

    try {
      if (REDIS_URL) {
        this.client = new Redis(REDIS_URL, {
          password: REDIS_PASSWORD,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3
        });

        await this.client.ping();
        this.useRedis = true;
        logger.info('Redis cache initialized');
      }
    } catch (error) {
      logger.warn('Redis connection failed, falling back to in-memory cache:', error);
    }

    if (!this.useRedis) {
      this.localCache = new NodeCache({
        stdTTL: CACHE_TTL,
        checkperiod: CACHE_CHECK_PERIOD,
        useClones: false
      });
      logger.info('In-memory cache initialized');
    }

    this.initialized = true;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<*>} Cached value
   */
  async get(key) {
    await this.init();

    try {
      if (this.useRedis) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return this.localCache.get(key);
      }
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = CACHE_TTL) {
    await this.init();

    try {
      if (this.useRedis) {
        await this.client.set(
          key,
          JSON.stringify(value),
          'EX',
          ttl
        );
      } else {
        this.localCache.set(key, value, ttl);
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  async delete(key) {
    await this.init();

    try {
      if (this.useRedis) {
        await this.client.del(key);
      } else {
        this.localCache.del(key);
      }
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  /**
   * Clear entire cache
   */
  async clear() {
    await this.init();

    try {
      if (this.useRedis) {
        await this.client.flushall();
      } else {
        this.localCache.flushAll();
      }
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  /**
   * Get or set cache value
   * @param {string} key - Cache key
   * @param {Function} getter - Function to get value if not cached
   * @param {number} ttl - Time to live in seconds
   */
  async getOrSet(key, getter, ttl = CACHE_TTL) {
    let value = await this.get(key);

    if (value === null) {
      value = await getter();
      if (value !== null) {
        await this.set(key, value, ttl);
      }
    }

    return value;
  }

  /**
   * Get multiple values from cache
   * @param {string[]} keys - Cache keys
   * @returns {Promise<Object>} Object with key-value pairs
   */
  async mget(keys) {
    await this.init();

    try {
      if (this.useRedis) {
        const values = await this.client.mget(keys);
        return keys.reduce((acc, key, index) => {
          acc[key] = values[index] ? JSON.parse(values[index]) : null;
          return acc;
        }, {});
      } else {
        return this.localCache.mget(keys);
      }
    } catch (error) {
      logger.error('Cache mget error:', error);
      return {};
    }
  }

  /**
   * Set multiple values in cache
   * @param {Object} keyValues - Object with key-value pairs
   * @param {number} ttl - Time to live in seconds
   */
  async mset(keyValues, ttl = CACHE_TTL) {
    await this.init();

    try {
      if (this.useRedis) {
        const multi = this.client.multi();
        Object.entries(keyValues).forEach(([key, value]) => {
          multi.set(key, JSON.stringify(value), 'EX', ttl);
        });
        await multi.exec();
      } else {
        this.localCache.mset(
          Object.entries(keyValues).map(([key, value]) => ({
            key,
            val: value,
            ttl
          }))
        );
      }
    } catch (error) {
      logger.error('Cache mset error:', error);
    }
  }

  /**
   * Increment value in cache
   * @param {string} key - Cache key
   * @param {number} value - Increment value
   */
  async increment(key, value = 1) {
    await this.init();

    try {
      if (this.useRedis) {
        return await this.client.incrby(key, value);
      } else {
        const current = this.localCache.get(key) || 0;
        const updated = current + value;
        this.localCache.set(key, updated);
        return updated;
      }
    } catch (error) {
      logger.error('Cache increment error:', error);
      return null;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    await this.init();

    try {
      if (this.useRedis) {
        return await this.client.exists(key) === 1;
      } else {
        return this.localCache.has(key);
      }
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }
}

module.exports = new CacheService();
