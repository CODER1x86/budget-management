/**
 * API Response Formatter Middleware
 * Standardizes API responses across the application
 */

const logger = require('../../utils/logger');
const { NODE_ENV } = require('../../config/environment');

class ResponseFormatter {
  /**
   * Format successful response
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @param {number} status - HTTP status code
   * @returns {Object} Formatted response
   */
  static success(data = null, message = 'Success', status = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return {
      body: response,
      status
    };
  }

  /**
   * Format error response
   * @param {Error} error - Error object
   * @param {number} status - HTTP status code
   * @returns {Object} Formatted error response
   */
  static error(error, status = 500) {
    const response = {
      success: false,
      error: {
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_SERVER_ERROR'
      },
      timestamp: new Date().toISOString()
    };

    // Add validation errors if available
    if (error.data) {
      response.error.details = error.data;
    }

    // Add stack trace in development
    if (NODE_ENV === 'development' && error.stack) {
      response.error.stack = error.stack;
    }

    return {
      body: response,
      status: error.status || status
    };
  }

  /**
   * Format paginated response
   * @param {Array} data - Page data
   * @param {Object} pagination - Pagination info
   * @param {string} message - Success message
   * @returns {Object} Formatted paginated response
   */
  static paginated(data, pagination, message = 'Success') {
    return {
      body: {
        success: true,
        message,
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          totalItems: pagination.totalItems,
          totalPages: pagination.totalPages,
          hasNext: pagination.hasNext,
          hasPrev: pagination.hasPrev
        },
        timestamp: new Date().toISOString()
      },
      status: 200
    };
  }

  /**
   * Express middleware to format responses
   */
  static middleware() {
    return (req, res, next) => {
      // Override res.json to format the response
      const originalJson = res.json;
      res.json = function(body) {
        // Skip formatting if already formatted
        if (body && typeof body === 'object' && 'success' in body) {
          return originalJson.call(this, body);
        }

        const formatted = ResponseFormatter.success(body);
        return originalJson.call(this, formatted.body);
      };

      // Add custom response methods
      res.success = function(data, message, status) {
        const formatted = ResponseFormatter.success(data, message, status);
        return res.status(formatted.status).json(formatted.body);
      };

      res.error = function(error, status) {
        const formatted = ResponseFormatter.error(error, status);
        return res.status(formatted.status).json(formatted.body);
      };

      res.paginated = function(data, pagination, message) {
        const formatted = ResponseFormatter.paginated(data, pagination, message);
        return res.status(formatted.status).json(formatted.body);
      };

      next();
    };
  }

  /**
   * Express error handling middleware
   */
  static errorHandler() {
    return (err, req, res, next) => {
      logger.error('API Error:', err);
      const formatted = ResponseFormatter.error(err);
      res.status(formatted.status).json(formatted.body);
    };
  }
}

module.exports = ResponseFormatter;
