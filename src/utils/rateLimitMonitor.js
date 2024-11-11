/**
 * Rate Limit Monitor
 * Monitors and reports rate limiting metrics
 */

const logger = require('./logger');
const rateLimiter = require('../api/middleware/rateLimiter');

class RateLimitMonitor {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * Record rate limit event
   * @param {string} clientId - Client identifier
   * @param {Object} result - Rate limit result
   */
  recordEvent(clientId, result) {
    if (!this.metrics.has(clientId)) {
      this.metrics.set(clientId, {
        attempts: 0,
        blocked: 0,
        lastAttempt: null
      });
    }

    const metric = this.metrics.get(clientId);
    metric.attempts++;
    if (result.remainingPoints === 0) {
      metric.blocked++;
    }
    metric.lastAttempt = new Date();
  }

  /**
   * Get client metrics
   * @param {string} clientId - Client identifier
   * @returns {Object} Client metrics
   */
  getClientMetrics(clientId) {
    return this.metrics.get(clientId);
  }

  /**
   * Get all metrics
   * @returns {Object} All metrics
   */
  getAllMetrics() {
    const result = {};
    for (const [clientId, metrics] of this.metrics) {
      result[clientId] = metrics;
    }
    return result;
  }

  /**
   * Clear old metrics
   * @param {number} age - Age in milliseconds
   */
  clearOldMetrics(age = 24 * 60 * 60 * 1000) { // Default: 24 hours
    const now = Date.now();
    for (const [clientId, metrics] of this.metrics) {
      if (now - metrics.lastAttempt.getTime() > age) {
        this.metrics.delete(clientId);
      }
    }
  }

  /**
   * Generate report
   * @returns {Object} Rate limiting report
   */
  generateReport() {
    const metrics = this.getAllMetrics();
    const totalAttempts = Object.values(metrics)
      .reduce((sum, m) => sum + m.attempts, 0);
    const totalBlocked = Object.values(metrics)
      .reduce((sum, m) => sum + m.blocked, 0);

    return {
      totalClients: Object.keys(metrics).length,
      totalAttempts,
      totalBlocked,
      blockRate: totalAttempts ? (totalBlocked / totalAttempts) * 100 : 0,
      topOffenders: Object.entries(metrics)
        .sort((a, b) => b[1].blocked - a[1].blocked)
        .slice(0, 10)
        .map(([clientId, m]) => ({
          clientId,
          attempts: m.attempts,
          blocked: m.blocked,
          lastAttempt: m.lastAttempt
        }))
    };
  }
}

module.exports = new RateLimitMonitor();
