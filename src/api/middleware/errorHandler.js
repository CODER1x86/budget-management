/**
 * Error Handler Middleware
 * Centralizes error handling for the entire application
 * Includes detailed logging and appropriate error responses
 */

const logger = require('../../utils/logger');
const { NODE_ENV } = require('../../config/environment');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_SERVER_ERROR', data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.data = data;
    Error.captureStackTrace(this, APIError);
  }
}

/**
 * Custom error class for validation errors
 */
class ValidationError extends APIError {
  constructor(errors) {
    super('Validation Error', 400, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for database errors
 */
class DatabaseError extends APIError {
  constructor(message, originalError) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * Custom error class for authentication errors
 */
class AuthenticationError extends APIError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Custom error class for authorization errors
 */
class AuthorizationError extends APIError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log error details
  logError(err, req);

  // Handle different types of errors
  if (err instanceof APIError) {
    return handleAPIError(err, res);
  }

  if (err.name === 'JsonWebTokenError') {
    return handleJWTError(err, res);
  }

  if (err.name === 'TokenExpiredError') {
    return handleTokenExpiredError(err, res);
  }

  if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    return handleJSONParseError(err, res);
  }

  // Handle unexpected errors
  return handleUnexpectedError(err, res);
};

/**
 * Log error details
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 */
const logError = (err, req) => {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: sanitizeRequestBody(req.body),
      headers: sanitizeHeaders(req.headers),
      ip: req.ip
    }
  };

  if (err instanceof DatabaseError && err.originalError) {
    errorDetails.error.originalError = {
      message: err.originalError.message,
      code: err.originalError.code
    };
  }

  logger.error('Error occurred:', errorDetails);
};

/**
 * Sanitize request body for logging
 * Removes sensitive information
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const sanitizeRequestBody = (body) => {
  if (!body) return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'credit_card', 'ssn'];
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Sanitize headers for logging
 * Removes sensitive information
 * @param {Object} headers - Request headers
 * @returns {Object} Sanitized headers
 */
const sanitizeHeaders = (headers) => {
  if (!headers) return headers;
  
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  sensitiveHeaders.forEach(header => {
    if (header in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Handle API errors
 * @param {APIError} err - API error
 * @param {Object} res - Express response object
 */
const handleAPIError = (err, res) => {
  const response = {
    success: false,
    error: {
      code: err.code,
      message: err.message
    }
  };

  if (err.data) {
    response.error.details = err.data;
  }

  if (NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(err.status).json(response);
};

/**
 * Handle JWT errors
 * @param {Error} err - JWT error
 * @param {Object} res - Express response object
 */
const handleJWTError = (err, res) => {
  res.status(401).json({
    success: false,
    error: {
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    }
  });
};

/**
 * Handle token expired errors
 * @param {Error} err - Token expired error
 * @param {Object} res - Express response object
 */
const handleTokenExpiredError = (err, res) => {
  res.status(401).json({
    success: false,
    error: {
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired'
    }
  });
};

/**
 * Handle JSON parse errors
 * @param {Error} err - JSON parse error
 * @param {Object} res - Express response object
 */
const handleJSONParseError = (err, res) => {
  res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_JSON',
      message: 'Invalid JSON in request body'
    }
  });
};

/**
 * Handle unexpected errors
 * @param {Error} err - Unexpected error
 * @param {Object} res - Express response object
 */
const handleUnexpectedError = (err, res) => {
  const response = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message
    }
  };

  if (NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(500).json(response);
};

/**
 * Error handling utility functions
 */
const errorUtils = {
  /**
   * Wrap async route handlers to catch errors
   * @param {Function} fn - Async route handler
   * @returns {Function} Wrapped route handler
   */
  asyncHandler: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },

  /**
   * Create a new API error
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {string} code - Error code
   * @param {*} data - Additional error data
   * @returns {APIError} API error
   */
  createError: (message, status, code, data) => {
    return new APIError(message, status, code, data);
  }
};

module.exports = {
  errorHandler,
  APIError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  errorUtils
};
